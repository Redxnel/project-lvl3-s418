import { promises as fs } from 'fs';
import axios from 'axios';
import cheerio from 'cheerio';
import { resolve } from 'url';
import debug from 'debug';
import chalk from 'chalk';
import Listr from 'listr';
import buildName from './buildName';

let newHtml = '';
let directoryForResource = '';

const log = debug('page-loader');

const getDataFromUrl = (uri, ctx) => axios({
  method: 'get',
  url: uri,
  responseType: 'arrayBuffer',
})
  .then((response) => {
    ctx.data = response.data;
  });

const tags = {
  link: 'href',
  img: 'src',
  script: 'src',
};

const isLocalLink = (link) => {
  const substr = link.substr(0, 4);
  return substr !== 'http';
};

const generateNameLink = (link, filepath) => `${filepath}/${link.split('/').filter(el => el).join('-')}`;

const getLinksAndModifyHtml = (html, filepath, ctx) => {
  const $ = cheerio.load(html);
  const links = Object.keys(tags).reduce((acc, tag) => {
    const findedLink = $(tag).map((i, element) => {
      const link = $(element).attr(tags[tag]) || '';
      const newLink = isLocalLink(link) ? generateNameLink(link, filepath) : link;
      $(element).attr(tags[tag], newLink);
      return isLocalLink(link) ? link : '';
    }).get();
    return [...acc, ...findedLink].filter(elem => elem);
  }, []);
  newHtml = $.html({ decodeEntities: false });
  ctx.content = { links, html: newHtml };
  log(chalk.magenta('new HTML created!'));
};

const writeResourceOnDisc = (page, linksFromPage) => linksFromPage.map(link => (
  {
    title: chalk.yellow(`Download: ${link}`),
    task: () => axios({
      method: 'get',
      url: resolve(page, link),
      responseType: 'arrayBuffer',
    })
      .then((response) => {
        const pathToWrite = generateNameLink(link, directoryForResource);
        log(chalk.magenta(`${link} updated to ${pathToWrite}`));
        return fs.writeFile(pathToWrite, response.data, 'utf-8');
      }),
  }));

export default (page, filepath) => {
  log(chalk.magenta('run page-loader'));
  const dirpath = buildName(page, filepath, '.html');
  directoryForResource = buildName(page, filepath, '_files');

  const tasks = new Listr([
    {
      title: chalk.green('The page is loading'),
      task: () => new Listr([
        {
          title: chalk.yellow('Create a directory to download the resource'),
          task: () => fs.mkdir(directoryForResource),
        },
        {
          title: chalk.yellow('Getting HTML data from page'),
          task: ctx => getDataFromUrl(page, ctx),
        },
        {
          title: chalk.yellow('Modifying HTML and getting resource'),
          task: ctx => getLinksAndModifyHtml(ctx.data, directoryForResource, ctx),
        },
        {
          title: chalk.yellow('Resources downloading and saving'),
          task: ctx => new Listr(writeResourceOnDisc(page, ctx.content.links, ctx),
            { concurrent: true }),
        },
        {
          title: chalk.yellow('Saving the page'),
          task: () => fs.writeFile(dirpath, newHtml, 'utf-8'),
        },
      ]),
    },
    {
      title: chalk.green(`Done! The page is saved in ${dirpath}`),
      task: () => log(chalk.magenta('Page loaded success!')),
    },
  ]);

  return tasks.run().catch(err => Promise.reject(err));
};

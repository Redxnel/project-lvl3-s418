import { promises as fs } from 'fs';
import axios from 'axios';
import cheerio from 'cheerio';
import path from 'path';
import { resolve } from 'url';
import debug from 'debug';
import buildName from './buildName';

const log = debug('page-loader');

const getDataFromUrl = uri => axios({
  method: 'get',
  url: uri,
  responseType: 'arrayBuffer',
})
  .then(response => response.data);

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

const getLinksAndModifyHtml = (html, filepath) => {
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
  log('New html created success!')
  return { links, html: $.html({ decodeEntities: false }) };
};

export default (page, filepath) => {
  let dirpath = '';
  let newHtml = '';
  const directoryForResource = buildName(page, filepath, '_files');
  return fs.mkdir(directoryForResource)
    .then(() => getDataFromUrl(page))
    .then(data => getLinksAndModifyHtml(data, directoryForResource))
    .then((content) => {
      newHtml = content.html;
      const linksFromPage = content.links;
      return Promise.all(linksFromPage.map(link => getDataFromUrl(resolve(page, link))
        .then((data) => {
          const updatedLink = generateNameLink(link, directoryForResource);
          const pathToWrite = path.join(updatedLink);
          log(`${link} updated to ${updatedLink}`);
          return fs.writeFile(pathToWrite, data, 'utf-8');
        })));
    })
    .then(() => {
      dirpath = buildName(page, filepath, '.html');
      return fs.writeFile(dirpath, newHtml, 'utf-8');
    })
    .then(() => {
      log(`page written on disc in ${dirpath}`);
      return dirpath;
    });
};

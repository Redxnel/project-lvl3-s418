import { promises as fs } from 'fs';
import axios from 'axios';
import cheerio from 'cheerio';
import path from 'path';
import { resolve } from 'url';
import buildName from './buildName';

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
  return { links, html: $.html() };
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
          const pathToWrite = path.join(generateNameLink(link, directoryForResource));
          return fs.writeFile(pathToWrite, data, 'utf-8');
        })));
    })
    .then(() => {
      dirpath = buildName(page, filepath, '.html');
      return fs.writeFile(dirpath, newHtml, 'utf-8');
    })
    .then(() => dirpath);
};

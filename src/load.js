import { promises as fs } from 'fs';
import axios from 'axios';
import cheerio from 'cheerio';
import path from 'path';
import { resolve } from 'url';
import buildName from './buildName';

const getDataFromUrl = (uri) => {
  return axios({
    method: 'get',
    url: uri,
    responseType: 'arrayBuffer'
  })
    .then(response => response.data);
};

const tags = {
  link: 'href',
  img: 'src',
  script: 'src',
};

const getLinksAndModifyHtml = (html) => {
  const $ = cheerio.load(html);
  const links = Object.keys(tags).reduce((acc, tag) => {
    const findedLink = $(tag).map((i, element) => {
      const link = $(element).attr(tags[tag]) || '';
      const newLink = link.split('/').join('-');
      $(element).attr(tags[tag], newLink);
      return link;
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
    .then((data) => getLinksAndModifyHtml(data))
    .then((content) => {
      newHtml = content.html;
      const promise = Promise.all(content.links.map(link => {
        return getDataFromUrl(resolve(page, link))
          .then((data) => fs.writeFile(path.join(directoryForResource, link.split('/').join('-')), data, 'utf-8'));
      }));
      return promise;
    })
    .then(() => {
      dirpath = buildName(page, filepath, '.html');
      return fs.writeFile(dirpath, newHtml)
    })
    .then(() => dirpath);
};

import { promises as fs } from 'fs';
import axios from 'axios';
import buildName from './buildName';

export default (page, filepath) => {
  const name = buildName(page, filepath);
  return axios.get(page)
    .then(response => fs.writeFile(name, response.data, 'utf-8'))
    .then(() => `Page loaded in ${name}`);
};

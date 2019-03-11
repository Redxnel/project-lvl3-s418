import { promises as fs } from 'fs';
import axios from 'axios';
import os from 'os';
import buildName from './buildName';

const tmpdir = `${os.tmpdir()}`;

export default (page, filepath = tmpdir) => {
  const name = buildName(page, filepath);
  return axios.get(page)
    .then((response) => {
      fs.writeFile(name, response.data, 'utf-8');
      return `Page loaded in ${name}`;
    });
};

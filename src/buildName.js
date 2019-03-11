import url from 'url';

export default (page, filepath) => {
  const { hostname, pathname } = url.parse(page);
  const hostParts = hostname.split('.');
  const pathParts = pathname.split('/').filter(v => v);
  return `${filepath}/${hostParts.concat(pathParts).join('-')}.html`;
};

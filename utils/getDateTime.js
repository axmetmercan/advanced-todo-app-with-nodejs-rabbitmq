const currentTimeToString = () => {
  const dateNow = Date.now();
  const date = new Date(dateNow);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hour = date.getHours();
  const min = date.getMinutes();
  const sec = date.getSeconds();

  return `${day}/${month + 1}/${year} ${hour}:${min}:${sec}`;
};

module.exports = currentTimeToString;

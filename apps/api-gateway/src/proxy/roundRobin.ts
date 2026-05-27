export function roundRobin(urls: string[]) {
  let index = 0;
  return () => {
    const url = urls[index % urls.length]!;
    index = (index + 1) % urls.length;
    return url;
  };
}


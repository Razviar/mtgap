import fs from 'fs';

type DataHandler = (data: string, byteRead: number) => void;
type ErrorHandler = (err: any, byteRead: number) => void; // tslint:disable-line:no-any
type EndHandler = (byteRead: number) => void;

interface SimpleReadStream {
  onData(handler: DataHandler): void;
  onError(handler: ErrorHandler): void;
  onEnd(handler: EndHandler): void;
  close(): void;
}

// Create a wrapper around a file stream to read file efficiently chunk by chunk, but ensure
// that each chunk end with a line break (ie. we read chunks of line and never split a line between
// chunks).
// It also keeps track of the number of bytes read so far.
export function createChunkReader(path: string, start: number): SimpleReadStream {
  const stream = fs.createReadStream(path, {
    encoding: 'utf8',
    autoClose: true,
    start,
  });
  let dataHandler: DataHandler | undefined;
  let errorHandler: ErrorHandler | undefined;
  let endHandler: EndHandler | undefined;

  let byteRead = 0;
  let buffer = '';
  stream.on('data', (chunk: string) => {
    const lastLineBreak = chunk.lastIndexOf('\n');
    if (lastLineBreak === -1) {
      // No line break, we keep the chunk in the buffer
      byteRead += chunk.length;
      buffer += chunk;
      return;
    }

    if (dataHandler) {
      dataHandler(buffer + chunk.slice(0, lastLineBreak + 1), byteRead);
    }
    byteRead += lastLineBreak + 1;
    buffer = chunk.slice(lastLineBreak + 1);
  });

  stream.on('error', err => {
    if (errorHandler) {
      errorHandler(err, byteRead);
    }
  });

  stream.on('end', () => {
    if (buffer.length > 0) {
      if (dataHandler) {
        dataHandler(buffer, byteRead);
      }
      byteRead += buffer.length;
    }
    if (endHandler) {
      endHandler(byteRead);
    }
  });

  return {
    onData: (handler: DataHandler) => (dataHandler = handler),
    onError: (handler: ErrorHandler) => (errorHandler = handler),
    onEnd: (handler: EndHandler) => (endHandler = handler),
    close: () => stream.close(),
  };
}

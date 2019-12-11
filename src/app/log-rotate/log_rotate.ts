import {deleteLogFiles} from 'root/app/log-rotate/delete_log_files';
import {transportFile} from 'root/app/log-rotate/transport_file';

const logAppName = 'MTGAproTracker';
const logMaxSize = 10 * 1024 * 1024;
const howManyDaysAgo = 2;

deleteLogFiles(howManyDaysAgo, logAppName);

function log(text: string): boolean {
  return transportFile(text, logAppName, logMaxSize);
}

export {log};

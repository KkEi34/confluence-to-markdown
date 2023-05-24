import {Bootstrap} from './Bootstrap';

let pathResource = process.argv[2]; // can also be a file
let pathResult = process.argv[3];

const bootstrap = new Bootstrap();
bootstrap.run(pathResource, pathResult);

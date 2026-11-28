const fs = require('node:fs');
const path = require('node:path');
const { parse, populate } = require('dotenv');

const backendEnvPath = path.resolve(__dirname, '..', '.env');

function loadBackendEnv(filePath = backendEnvPath, environment = process.env) {
  let input;
  try {
    input = fs.readFileSync(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return { filePath, found: false };
  }

  // Notepad y Windows PowerShell también pueden guardar el archivo como UTF-16.
  if (input[0] === 0xff && input[1] === 0xfe) {
    input = input.subarray(2).toString('utf16le');
  } else if (input[0] === 0xfe && input[1] === 0xff) {
    input = input.subarray(2).swap16().toString('utf16le');
  }
  const values = parse(input);
  populate(environment, values);

  return { filePath, found: true, filePassword: values.DB_PASSWORD };
}

function mysqlPassword(environment, localEnv) {
  return environment.DB_PASSWORD || environment.MYSQLPASSWORD || localEnv.filePassword || '';
}

module.exports = { loadBackendEnv, mysqlPassword };

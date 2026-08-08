/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['rules.emulator.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
}

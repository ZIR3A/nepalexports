import { provider } from './providers/vercelBlob.provider';

/**
 * Storage Service Abstraction
 * This service acts as a proxy to the active storage provider.
 * Components should call this service instead of the provider directly.
 */

export const uploadFile = async (file, options) => {
  return provider.uploadFile(file, options);
};

export const deleteFile = async (url) => {
  return provider.deleteFile(url);
};

export const getFileUrl = async (key) => {
  return provider.getFileUrl(key);
};

export const replaceFile = async (oldUrl, newFile, options) => {
  return provider.replaceFile(oldUrl, newFile, options);
};

export const uploadMultipleFiles = async (files, options) => {
  return provider.uploadMultipleFiles(files, options);
};

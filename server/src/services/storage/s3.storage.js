'use strict';

const env = require('../../config/env');
const { safeFileName } = require('../../utils/sanitize');

let s3Client = null;
let sdk = null;

/** Loads the AWS SDK only when S3 is actually configured. */
const getClient = () => {
  if (s3Client) return { client: s3Client, sdk };
  // eslint-disable-next-line global-require
  sdk = require('@aws-sdk/client-s3');
  s3Client = new sdk.S3Client({
    region: env.aws.region,
    credentials: {
      accessKeyId: env.aws.accessKeyId,
      secretAccessKey: env.aws.secretAccessKey,
    },
  });
  return { client: s3Client, sdk };
};

const put = async (file) => {
  const { client, sdk: s3 } = getClient();
  const fileName = `tickets/${safeFileName(file.originalname)}`;

  await client.send(
    new s3.PutObjectCommand({
      Bucket: env.aws.s3Bucket,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ServerSideEncryption: 'AES256',
    })
  );

  return {
    fileName,
    url: `https://${env.aws.s3Bucket}.s3.${env.aws.region}.amazonaws.com/${fileName}`,
    storage: 's3',
  };
};

const remove = async (fileName) => {
  const { client, sdk: s3 } = getClient();
  await client.send(new s3.DeleteObjectCommand({ Bucket: env.aws.s3Bucket, Key: fileName }));
};

/** Time-limited download URL, used when the bucket is private. */
const getSignedUrl = async (fileName, expiresIn = 900) => {
  const { client, sdk: s3 } = getClient();
  // eslint-disable-next-line global-require
  const { getSignedUrl: sign } = require('@aws-sdk/s3-request-presigner');
  return sign(client, new s3.GetObjectCommand({ Bucket: env.aws.s3Bucket, Key: fileName }), { expiresIn });
};

module.exports = { put, remove, getSignedUrl, driver: 's3' };

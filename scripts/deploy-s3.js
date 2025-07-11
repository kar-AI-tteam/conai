import { execSync } from 'child_process';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { S3Client, PutObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import mime from 'mime-types';

// Configuration
const config = {
  bucketName: 'your-bucket-name', // Replace with your S3 bucket name
  region: 'us-east-1', // Replace with your bucket region
  buildDir: 'dist', // Vite's default build output directory
};

// Initialize S3 client
const s3Client = new S3Client({ region: config.region });

async function deployToS3() {
  try {
    console.log('🚀 Starting deployment process...');

    // Build the project
    console.log('\n📦 Building project...');
    execSync('npm run build', { stdio: 'inherit' });

    // Upload files to S3
    console.log('\n📤 Uploading files to S3...');
    await uploadDirectoryToS3(config.buildDir);

    console.log('\n✅ Deployment completed successfully!');
    console.log(`\n🌎 Your website is available at: http://${config.bucketName}.s3-website-${config.region}.amazonaws.com`);
  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

async function uploadDirectoryToS3(directory) {
  // Get list of all files in the build directory
  const files = getAllFiles(directory);
  console.log(`Found ${files.length} files to upload`);

  // Delete existing files (optional, but helps clean up old assets)
  await deleteExistingFiles(files);

  // Upload all files
  let uploadedCount = 0;
  const totalFiles = files.length;

  for (const file of files) {
    const fileContent = readFileSync(file);
    const key = file.replace(`${config.buildDir}/`, '');
    const contentType = mime.lookup(file) || 'application/octet-stream';

    const uploadParams = {
      Bucket: config.bucketName,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
      CacheControl: getCacheControl(file),
    };

    try {
      await s3Client.send(new PutObjectCommand(uploadParams));
      uploadedCount++;
      const progress = Math.round((uploadedCount / totalFiles) * 100);
      process.stdout.write(`\rProgress: ${progress}% (${uploadedCount}/${totalFiles})`);
    } catch (error) {
      console.error(`\nError uploading ${key}:`, error);
      throw error;
    }
  }
  console.log('\n'); // New line after progress
}

function getAllFiles(dir, arrayOfFiles = []) {
  const files = readdirSync(dir, { withFileTypes: true });

  files.forEach(file => {
    const fullPath = join(dir, file.name);
    if (file.isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

async function deleteExistingFiles(localFiles) {
  try {
    const objectsToDelete = localFiles.map(file => ({
      Key: file.replace(`${config.buildDir}/`, '')
    }));

    if (objectsToDelete.length > 0) {
      await s3Client.send(new DeleteObjectsCommand({
        Bucket: config.bucketName,
        Delete: { Objects: objectsToDelete }
      }));
    }
  } catch (error) {
    console.error('Error deleting existing files:', error);
    // Continue with upload even if deletion fails
  }
}

function getCacheControl(filename) {
  // Cache static assets longer than HTML files
  if (filename.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$/)) {
    return 'public, max-age=31536000'; // 1 year
  }
  return 'no-cache, no-store, must-revalidate'; // No cache for HTML files
}

// Run the deployment
deployToS3();
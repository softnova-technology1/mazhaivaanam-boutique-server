import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const uploadLogo = async () => {
  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const fileContent = fs.readFileSync(
      "C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\3aeb812d-e421-4f53-9747-d84a3c8c1f9c\\media__1788261527982.jpg"
    );

    const fileName = `assets/email-logo-${Date.now()}.jpg`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: fileContent,
      ContentType: "image/jpeg",
    });

    await s3Client.send(command);

    // If AWS_S3_PUBLIC_URL is empty in .env, we construct the AWS URL
    const publicUrl = process.env.AWS_S3_PUBLIC_URL 
      ? `${process.env.AWS_S3_PUBLIC_URL}/${fileName}`
      : `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    console.log("SUCCESS:");
    console.log(publicUrl);
  } catch (error) {
    console.error("ERROR:");
    console.error(error);
  }
};

uploadLogo();

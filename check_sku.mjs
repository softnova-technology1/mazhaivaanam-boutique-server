// Script to check actual DB documents for existing products
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dns from 'dns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch {}

const MONGODB_URI = 'mongodb+srv://softnovatech24:softnovatech24@cluster0.xz6g4.mongodb.net/?appName=Cluster0';

await mongoose.connect(MONGODB_URI);
console.log('✅ Connected to MongoDB\n');

// Fetch raw product documents — only fields we care about
const products = await mongoose.connection.collection('products').find(
  {},
  { projection: { name: 1, sku: 1, patternCode: 1, patternSeq: 1, normalizedName: 1, category: 1 } }
).toArray();

console.log(`📦 Total Products in DB: ${products.length}\n`);
console.log('─'.repeat(70));

products.forEach((p, i) => {
  console.log(`${i + 1}. "${p.name}"`);
  console.log(`   SKU          : ${p.sku         ?? '❌ NOT SET (undefined)'}`);
  console.log(`   patternCode  : ${p.patternCode  ?? '❌ NOT SET'}`);
  console.log(`   patternSeq   : ${p.patternSeq   ?? '❌ NOT SET'}`);
  console.log(`   normalizedName: ${p.normalizedName ?? '❌ NOT SET'}`);
  console.log('─'.repeat(70));
});

const withSku    = products.filter(p => p.sku).length;
const withoutSku = products.filter(p => !p.sku).length;

console.log(`\n✅ Products WITH SKU    : ${withSku}`);
console.log(`❌ Products WITHOUT SKU : ${withoutSku}`);

await mongoose.disconnect();

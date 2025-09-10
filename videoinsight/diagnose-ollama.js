#!/usr/bin/env node

// Ollama diagnostic script
const { spawn } = require('child_process');

console.log('🔍 Ollama Diagnostic Script');
console.log('============================\n');

function runCommand(command, args, description) {
  return new Promise((resolve) => {
    console.log(`📋 ${description}`);
    console.log(`💻 Running: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args);
    let output = '';
    let errorOutput = '';
    
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    process.on('close', (code) => {
      console.log(`📊 Exit code: ${code}`);
      if (output) {
        console.log(`✅ Output:\n${output}`);
      }
      if (errorOutput) {
        console.log(`⚠️  Error output:\n${errorOutput}`);
      }
      console.log('─'.repeat(50));
      resolve({ code, output, errorOutput });
    });
    
    process.on('error', (error) => {
      console.log(`❌ Process error: ${error.message}`);
      console.log('─'.repeat(50));
      resolve({ code: -1, output: '', errorOutput: error.message });
    });
  });
}

async function diagnose() {
  // Check if Ollama is installed
  await runCommand('ollama', ['--version'], 'Checking Ollama installation');
  
  // Check if Ollama service is running
  await runCommand('ollama', ['list'], 'Checking available models');
  
  // Try to run a simple test with qwen3
  console.log('🧪 Testing qwen3 model...');
  const testProcess = spawn('ollama', ['run', 'qwen3']);
  
  setTimeout(() => {
    testProcess.stdin.write('Hello, can you respond with just "OK"?\n');
    testProcess.stdin.end();
  }, 1000);
  
  let testOutput = '';
  let testError = '';
  
  testProcess.stdout.on('data', (data) => {
    testOutput += data.toString();
    console.log('📥 Test output:', data.toString());
  });
  
  testProcess.stderr.on('data', (data) => {
    testError += data.toString();
    console.log('⚠️  Test error:', data.toString());
  });
  
  setTimeout(() => {
    console.log('⏱️  Test timeout reached, killing process...');
    testProcess.kill('SIGTERM');
  }, 30000); // 30 second timeout
  
  testProcess.on('close', (code) => {
    console.log(`📊 Test completed with code: ${code}`);
    console.log(`📄 Test output length: ${testOutput.length}`);
    console.log(`📄 Test error length: ${testError.length}`);
    
    if (testError.includes('not found')) {
      console.log('💡 Suggestion: Install qwen3 model with: ollama pull qwen3');
    } else if (testError.includes('connection refused')) {
      console.log('💡 Suggestion: Start Ollama service with: ollama serve');
    } else if (testOutput.length > 0) {
      console.log('✅ qwen3 model is working correctly!');
    }
  });
}

diagnose().catch(console.error);
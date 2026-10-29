import { test, expect } from '@playwright/test';

function silentWave(): Buffer {
  const samples=11025/4;
  const pcm=Buffer.alloc(Math.floor(samples)*2);
  const wave=Buffer.alloc(44+pcm.length);
  wave.write('RIFF',0,'ascii');wave.writeUInt32LE(wave.length-8,4);
  wave.write('WAVE',8,'ascii');wave.write('fmt ',12,'ascii');wave.writeUInt32LE(16,16);
  wave.writeUInt16LE(1,20);wave.writeUInt16LE(1,22);wave.writeUInt32LE(11025,24);
  wave.writeUInt32LE(22050,28);wave.writeUInt16LE(2,32);wave.writeUInt16LE(16,34);
  wave.write('data',36,'ascii');wave.writeUInt32LE(pcm.length,40);pcm.copy(wave,44);
  return wave;
}

test('FFmpeg WebAssembly starts locally and transcodes a small WAV file',async({page})=>{
  test.setTimeout(165000);
  const exceptions:string[]=[];
  page.on('pageerror',e=>exceptions.push(e.message));
  await page.goto('/');
  await page.getByRole('button',{name:'All tools'}).first().click();
  await page.getByPlaceholder('Search working tools...').fill('WAV to MP3');
  await page.getByRole('button',{name:'Open WAV to MP3'}).click();
  await page.locator('input[type=file]').setInputFiles({name:'short.wav',mimeType:'audio/wav',buffer:silentWave()});
  await page.getByRole('button',{name:'Convert on this device'}).click();
  await expect(page.getByText('FFmpeg engine ready on this device.')).toBeVisible({timeout:120000});
  await expect(page.getByRole('link',{name:/Download short-ToolNest\.mp3/})).toBeVisible({timeout:45000});
  expect(exceptions).toEqual([]);
});

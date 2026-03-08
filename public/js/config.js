// js/config.js
const supabaseUrl = 'https://ihnkersdbylugobbulmy.supabase.co';
const supabaseAnonKey = 'sb_publishable_DuarQo-rGVGViEK7hZjfTg_9urgT5ws';

// 初始化 Supabase
const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// 初始化 FFmpeg（自托管路径）
let ffmpegInstance = null;
if (typeof FFmpeg !== 'undefined') {
  const { createFFmpeg } = FFmpeg;
  ffmpegInstance = createFFmpeg({
    corePath: '/ffmpeg/ffmpeg-core.wasm',
    log: false
  });
} else {
  console.warn('FFmpeg not available');
}

// 全局状态
let currentUser = null;

// 导出（通过 window 暴露）
window.supabaseClient = supabaseClient;
window.ffmpegInstance = ffmpegInstance;
window.currentUser = currentUser;


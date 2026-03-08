// js/user.js
async function loadUserPage(userId) {
  const isSelf = window.currentUser && window.currentUser.id === userId;
  const main = document.querySelector('main');

  try {
    const { data: user, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;

    let html = `<h2>${escapeHtml(user.display_name)} 的主页</h2>`;

    if (isSelf) {
      html += `
        <div class="card" style="margin: 1.5rem 0;">
          <h3>上传新歌</h3>
          <form id="upload-form">
            <div class="form-group">
              <label>音频文件</label>
              <input type="file" accept="audio/*" id="audioFile" required />
            </div>
            <div class="form-group">
              <label>歌曲标题</label>
              <input type="text" id="songTitle" required />
            </div>
            <button type="submit" class="btn btn-primary">上传</button>
          </form>
        </div>
      `;
    }

    // 加载创作
    const { data: songs } = await supabaseClient
      .from('songs')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    html += `<h3>创作 (${songs.length})</h3><div class="masonry-grid">`;
    if (songs.length === 0) {
      html += '<p class="empty">暂无创作</p >';
    } else {
      songs.forEach(song => {
        html += `
          <div class="card">
            <h3>${escapeHtml(song.title)}</h3>
            <p>分发: ${song.distribution_count}</p >
            <button class="btn" onclick="playPreview('${song.id}')">▶ 试听</button>
          </div>
        `;
      });
    }
    html += '</div>';

    main.innerHTML = html;

    if (isSelf) {
      document.getElementById('upload-form').addEventListener('submit', handleUpload);
    }
  } catch (err) {
    main.innerHTML = `<p class="error">加载失败: ${err.message}</p >`;
  }
}

async function handleUpload(e) {
  e.preventDefault();
  const fileInput = document.getElementById('audioFile');
  const titleInput = document.getElementById('songTitle');
  const file = fileInput.files;
  const title = titleInput.value.trim();

  if (!file || !title) return alert('请填写完整');

  if (!window.ffmpegInstance) {
    return alert('音频处理不可用');
  }

  try {
    const statusDiv = document.querySelector('.loading');
    statusDiv.textContent = '正在处理音频...';
    statusDiv.classList.remove('hidden');

    if (!window.ffmpegInstance.isLoaded()) {
      await window.ffmpegInstance.load();
    }

    const { fetchFile } = FFmpeg;
    window.ffmpegInstance.FS('writeFile', 'input', await fetchFile(file));
    await window.ffmpegInstance.run('-i', 'input', '-t', '30', '-acodec', 'copy', 'preview.mp3');

    const songId = crypto.randomUUID();
    const previewData = window.ffmpegInstance.FS('readFile', 'preview.mp3');
    const fullData = window.ffmpegInstance.FS('readFile', 'input');

    // 上传
    const { error: err1 } = await supabaseClient.storage.from('previews').upload(`${songId}.mp3`, new Blob([previewData]));
    if (err1) throw err1;
    const { error: err2 } = await supabaseClient.storage.from('full').upload(`${songId}.mp3`, new Blob([fullData]));
    if (err2) throw err2;
    const { error: err3 } = await supabaseClient.rpc('upload_song', {
      _user_id: window.currentUser.id,
      _title: title,
      _song_id: songId
    });
    if (err3) throw err3;

    alert('上传成功！');
    fileInput.value = '';
    titleInput.value = '';
    loadUserPage(window.currentUser.id);
  } catch (err) {
    alert('上传失败: ' + (err.message || '未知错误'));
    console.error(err);
  }
}

window.loadUserPage = loadUserPage;
window.handleUpload = handleUpload;


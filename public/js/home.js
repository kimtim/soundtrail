// js/home.js
async function loadSongs(orderBy = 'created_at') {
  const main = document.querySelector('main');
  try {
    const { data: songs, error } = await supabaseClient
      .from('songs')
      .select(`*, creator:users(display_name)`)
      .order(orderBy, { ascending: false });

    if (error) throw error;

    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
        <h2>最新歌曲</h2>
        <div>
          <button class="btn" onclick="loadSongs('created_at')">按时间</button>
          <button class="btn" onclick="loadSongs('distribution_count')">按热度</button>
        </div>
      </div>
      <div class="masonry-grid">
    `;

    if (songs.length === 0) {
      html += '<p class="empty">暂无歌曲</p >';
    } else {
      songs.forEach(song => {
        html += `
          <div class="card">
            <h3>${escapeHtml(song.title)}</h3>
            <p>by ${escapeHtml(song.creator.display_name)}</p >
            <p>分发: ${song.distribution_count}</p >
            <button class="btn" onclick="playPreview('${song.id}')">▶ 试听 30s</button>
            <a href=" " class="btn-link">详情</a >
          </div>
        `;
      });
    }
    html += '</div>';
    main.innerHTML = html;
  } catch (err) {
    main.innerHTML = `<p class="error">加载失败: ${err.message}</p >`;
  }
}

async function playPreview(songId) {
  try {
    const { data } = supabaseClient.storage.from('previews').getPublicUrl(`${songId}.mp3`);
    const audio = new Audio(data.publicUrl);
    audio.play().catch(e => console.warn('自动播放被阻止:', e));
  } catch (err) {
    alert('试听失败');
  }
}

window.loadSongs = loadSongs;
window.playPreview = playPreview;


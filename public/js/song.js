// js/song.js
async function loadSongPage(songId, distributorId) {
  const main = document.querySelector('main');
  try {
    const { data: song, error } = await supabaseClient
      .from('songs')
      .select(`*, creator:users(display_name)`)
      .eq('id', songId)
      .single();
    if (error) throw error;

    let hasAccess = false;
    if (window.currentUser) {
      const { data: record } = await supabaseClient
        .from('user_songs')
        .select()
        .eq('user_id', window.currentUser.id)
        .eq('song_id', songId)
        .maybeSingle();
      hasAccess = !!record;
    }

    let html = `
      <div class="card">
        <h2>${escapeHtml(song.title)}</h2>
        <p><strong>创作者:</strong> ${escapeHtml(song.creator.display_name)}</p >
        <p><strong>分发者:</strong> <a href=" ">查看主页</a ></p >
    `;

    if (hasAccess) {
      // 已购买：调用后端获取签名URL（需实现 /api/get-full-track）
      const session = (await supabaseClient.auth.getSession()).data.session;
      const res = await fetch(`/api/get-full-track?song_id=${encodeURIComponent(songId)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const url = await res.text();
        html += `<audio controls src="${url}"></audio>`;
      } else {
        html += '<p class="error">无法加载完整版</p >';
      }
    } else {
      const { data } = supabaseClient.storage.from('previews').getPublicUrl(`${songId}.mp3`);
      html += `
        <audio controls src="${data.publicUrl}"></audio>
        <button class="btn btn-primary" onclick="purchaseSong('${songId}', '${distributorId}')">支付 10 积分购买</button>
      `;
    }
    html += '</div>';
    main.innerHTML = html;
  } catch (err) {
    main.innerHTML = `<p class="error">加载失败: ${err.message}</p >`;
  }
}

async function purchaseSong(songId, distributorId) {
  if (!window.currentUser) return alert('请先登录');
  try {
    const { error } = await supabaseClient.rpc('purchase_song', {
      _buyer_id: window.currentUser.id,
      _song_id: songId,
      _distributor_id: distributorId
    });
    if (error) throw error;
    alert('购买成功！刷新页面播放完整版');
    location.reload();
  } catch (err) {
    alert('购买失败: ' + (err.message || '未知错误'));
  }
}

window.loadSongPage = loadSongPage;
window.purchaseSong = purchaseSong;


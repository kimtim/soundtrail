// js/auth.js
async function initAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  window.currentUser = session?.user || null;
  updateAuthUI();
}

function updateAuthUI() {
  const authEl = document.getElementById('auth-status');
  if (!authEl) return;

  if (window.currentUser) {
    // 获取用户资料
    supabaseClient
      .from('users')
      .select('display_name, balance')
      .eq('id', window.currentUser.id)
      .single()
      .then(({ data, error }) => {
        if (error) return;
        authEl.innerHTML = `
          <span>你好, ${escapeHtml(data.display_name)} | 积分: ${data.balance}</span>
          <button class="btn" onclick="logout()">退出</button>
          <a href=" " class="btn-link">我的主页</a >
        `;
      });
  } else {
    authEl.innerHTML = '<a href="login.html" class="btn">登录 / 注册</a >';
  }
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.currentUser = null;
  updateAuthUI();
  if (window.location.pathname.includes('user.html')) {
    window.location.href = 'index.html';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 暴露全局
window.initAuth = initAuth;
window.updateAuthUI = updateAuthUI;
window.logout = logout;
window.escapeHtml = escapeHtml;


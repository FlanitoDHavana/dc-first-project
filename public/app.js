document.addEventListener('DOMContentLoaded', () => {
  const statusBox = document.getElementById('statusBox');
  const statusText = document.getElementById('statusText');
  const checkBtn = document.getElementById('checkBtn');
  const apiOutput = document.getElementById('apiOutput');
  const indicator = statusBox.querySelector('.indicator');

  async function checkHealth() {
    try {
      statusText.textContent = 'Connecting...';
      const response = await fetch('/api/health');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      indicator.classList.add('online');
      statusText.textContent = `Server Online (Uptime: ${Math.round(data.uptime)}s)`;
      apiOutput.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      indicator.classList.remove('online');
      statusText.textContent = 'Server Unreachable / Error';
      apiOutput.textContent = `Error: ${err.message}`;
    }
  }

  checkBtn.addEventListener('click', checkHealth);

  // Initial check
  checkHealth();
});


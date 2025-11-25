const form = document.getElementById('settingsform');
form.addEventListener('submit', async (e) => {
  e.preventDefault(); 
  const formData = new FormData(form);

  const data = {};
  formData.forEach((value, key) => data[key] = value);
  console.log(data);
  try {
    const response = await fetch('/save-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    console.log('Server response:', result);
  } catch (error) {
    console.error('Error sending POST request:', error);
  }
});
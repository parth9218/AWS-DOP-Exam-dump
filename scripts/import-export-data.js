// Paste inside the DevTools (Crtl + Shift + J)

// Export
function exportData() {
  const data = {
    mockExam_answers: JSON.parse(localStorage.getItem("mockExam_answers") || "{}"),
    mockExam_flags: JSON.parse(localStorage.getItem("mockExam_flags") || "[]"),
    mockExam_currentQ: JSON.parse(localStorage.getItem("mockExam_currentQ") || "[]")
  };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `AWS-DOP-C02-attempt-${new Date().toISOString().split("T")[0]}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}
exportData()

// Import
function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const data = JSON.parse(e.target.result);
        localStorage.setItem("mockExam_answers", JSON.stringify(data.mockExam_answers));
        localStorage.setItem("mockExam_flags", JSON.stringify(data.mockExam_flags));
        localStorage.setItem("mockExam_currentQ", JSON.stringify(data.mockExam_currentQ));
        alert("Data imported successfully! Reloading...");
        location.reload();
      };
      reader.readAsText(file);
    }
  };
  input.click();
}
importData()
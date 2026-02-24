(function() {
    const LOGIN_LOG_KEY = 'login:log';
    
    function safeParseJSON(value, fallback) {
        try {
            const parsed = JSON.parse(value);
            return parsed ?? fallback;
        } catch {
            return fallback;
        }
    }
    
    function loadLoginLog() {
        const raw = localStorage.getItem(LOGIN_LOG_KEY);
        const parsed = safeParseJSON(raw, []);
        return Array.isArray(parsed) ? parsed : [];
    }
    
    function saveLoginLog(log) {
        localStorage.setItem(LOGIN_LOG_KEY, JSON.stringify(log));
    }
    
    function addLoginEntry(username, success, timestamp = new Date()) {
        const log = loadLoginLog();
        log.unshift({
            username: username,
            success: success,
            timestamp: timestamp.toISOString(),
            date: timestamp.toLocaleDateString('th-TH'),
            time: timestamp.toLocaleTimeString('th-TH')
        });
        
        // Keep only last 1000 entries to prevent storage overflow
        if (log.length > 1000) {
            log.splice(1000);
        }
        
        saveLoginLog(log);
    }
    
    function exportToExcel() {
        const log = loadLoginLog();
        
        if (log.length === 0) {
            alert('ไม่มีข้อมูลการเข้าสู่ระบบสำหรับส่งออก');
            return;
        }
        
        // Create CSV content
        let csvContent = '\uFEFF'; // BOM for UTF-8
        csvContent += 'วันที่,เวลา,ชื่อผู้ใช้,สถานะการเข้าสู่ระบบ\n';
        
        log.forEach(entry => {
            csvContent += `"${entry.date}","${entry.time}","${entry.username}","${entry.success ? 'สำเร็จ' : 'ไม่สำเร็จ'}"\n`;
        });
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().slice(0, 10);
        link.setAttribute('href', url);
        link.setAttribute('download', `login_data_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    function displayLoginLog() {
        const log = loadLoginLog();
        const container = document.getElementById('loginLogContainer');
        
        if (!container) return;
        
        if (log.length === 0) {
            container.innerHTML = '<p>ไม่มีข้อมูลการเข้าสู่ระบบ</p>';
            return;
        }
        
        let html = '<table class="login-log-table"><thead><tr>';
        html += '<th>วันที่</th><th>เวลา</th><th>ชื่อผู้ใช้</th><th>สถานะ</th>';
        html += '</tr></thead><tbody>';
        
        log.slice(0, 50).forEach(entry => { // Show only last 50 entries
            const statusClass = entry.success ? 'success' : 'error';
            const statusText = entry.success ? 'สำเร็จ' : 'ไม่สำเร็จ';
            
            html += `<tr>
                <td>${entry.date}</td>
                <td>${entry.time}</td>
                <td>${entry.username}</td>
                <td class="${statusClass}">${statusText}</td>
            </tr>`;
        });
        
        html += '</tbody></table>';
        
        if (log.length > 50) {
            html += `<p class="log-note">แสดง 50 รายการล่าสุดจากทั้งหมด ${log.length} รายการ</p>`;
        }
        
        container.innerHTML = html;
    }
    
    // Expose functions globally
    window.excelExport = {
        addLoginEntry,
        exportToExcel,
        displayLoginLog,
        loadLoginLog
    };
})();

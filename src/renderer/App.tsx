import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Upload } from 'antd';
import './App.scss';

function Page() {
  const handleBeforeUpload = (file: File) => {
    window.electron.ipcRenderer.sendMessage('ipc-upload', file.path)
    return false
  };

  return (
    <div className="app">
      <div className='app-context'>
        <h1>请选择目标文件夹</h1>
        <Upload beforeUpload={handleBeforeUpload}>
          <Button icon={<UploadOutlined />}>Upload Directory</Button>
        </Upload>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Page />} />
      </Routes>
    </Router>
  );
}

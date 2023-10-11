import { useState, useEffect, useRef } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import {
  PlusOutlined,
  AndroidOutlined,
  AppleOutlined,
} from '@ant-design/icons';
import { Upload, Modal, message, Button, Tabs } from 'antd';
import type { RcFile, UploadProps } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';
import './App.scss';

export type HandleMessage = {
  status: 'success' | 'error';
  file?: string;
  message: string;
  error?: string;
};

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

function Page() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [compressStatus, setCompressStatus] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState(false);
  const needHandleFileRef = useRef<File[]>([]);

  useEffect(() => {
    window.electron.ipcRenderer.on(
      'ipc-upload',
      (fileMessage: HandleMessage) => {
        if (fileMessage.status === 'success') {
          setCompressStatus(true);
          message.success({
            type: 'success',
            content: '文件压缩完毕',
          });
        } else {
          setCompressStatus(false);
          message.success({
            type: 'error',
            content: '文件压缩失败',
          });
          console.error(fileMessage.error);
        }
      },
    );

    window.electron.ipcRenderer.on(
      'ipc-download',
      (fileMessage: HandleMessage) => {
        if (fileMessage.status === 'success') {
          setDownloadStatus(true);
          message.success({
            type: 'success',
            content: '文件下载完毕',
          });
        }
      },
    );
  }, []);

  const handleCancel = () => setPreviewOpen(false);

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(
      file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1),
    );
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) =>
    setFileList(newFileList);

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传</div>
    </div>
  );

  const handleUpload = (file: File) => {
    needHandleFileRef.current.push(file);
    return false;
  };

  const uploadToCompress = () => {
    if (needHandleFileRef.current.length) {
      needHandleFileRef.current.forEach((file) => {
        window.electron.ipcRenderer.sendMessage('ipc-upload', file.path);
      });
    }
  };

  const tabsData = [
    {
      icon: () => AppleOutlined,
      label: 'png压缩',
      children: (
        <div className="app-context">
          <div className="app-upload">
            <Upload
              listType="picture-card"
              beforeUpload={handleUpload}
              fileList={fileList}
              onPreview={handlePreview}
              onChange={handleChange}
            >
              {fileList.length >= 1 ? null : uploadButton}
            </Upload>

            <div className="btns">
              <Button
                type="primary"
                onClick={uploadToCompress}
                disabled={!needHandleFileRef.current.length || compressStatus}
              >
                开始压缩
              </Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: () => AndroidOutlined,
      label: 'png=>apng',
      children: (
        <div className="app-context">
          <div className="app-upload">
            <Upload
              listType="picture-card"
              beforeUpload={handleUpload}
              fileList={fileList}
              onPreview={handlePreview}
              onChange={handleChange}
            >
              {fileList.length >= 100 ? null : uploadButton}
            </Upload>

            <div className="btns">
              <Button
                type="primary"
                onClick={uploadToCompress}
                disabled={!needHandleFileRef.current.length || compressStatus}
              >
                开始合成
              </Button>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="app">
      <Tabs
        className="tabs"
        tabPosition="left"
        defaultActiveKey="1"
        items={tabsData.map(({ label, children }, i) => {
          const id = String(i + 1);

          return {
            label: <span>{label}</span>,
            key: id,
            children,
          };
        })}
      />

      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={handleCancel}
      >
        <img alt="example" style={{ width: '100%' }} src={previewImage} />
      </Modal>
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

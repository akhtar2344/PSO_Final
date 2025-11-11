import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { login } from '../utils/api';

// Halaman Login
// User input email dan password untuk masuk ke aplikasi
function Login({ setUser }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Fungsi yang dijalankan saat form disubmit
  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Panggil API login
      const data = await login(values.email, values.password);
      
      // Simpan user data di state
      setUser(data.user);
      
      // Tampilkan pesan sukses
      message.success('Login berhasil!');
      
      // Redirect ke dashboard
      navigate('/');
    } catch (error) {
      // Tampilkan pesan error
      message.error('Login gagal: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      <Card 
        title={
          <div style={{ textAlign: 'center' }}>
            <h2>Material Management</h2>
            <p style={{ color: '#888', fontSize: '14px' }}>Login to your account</p>
          </div>
        }
        style={{ width: 400, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
      >
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          {/* Input Email */}
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Masukkan email!' },
              { type: 'email', message: 'Email tidak valid!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="email@example.com" 
              size="large"
            />
          </Form.Item>

          {/* Input Password */}
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Masukkan password!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Password" 
              size="large"
            />
          </Form.Item>

          {/* Submit Button */}
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large"
              loading={loading}
            >
              Login
            </Button>
          </Form.Item>
        </Form>

        {/* Info untuk testing */}
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          background: '#f6f6f6', 
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <strong>Demo Account:</strong><br />
          Email: admin@demo.com<br />
          Password: admin123
        </div>
      </Card>
    </div>
  );
}

export default Login;

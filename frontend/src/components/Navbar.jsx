import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, message } from 'antd';
import { HomeOutlined, AppstoreOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import { logout } from '../utils/api';

const { Header } = Layout;

// Component Navbar
// Menampilkan navigation bar dengan menu dan tombol logout
function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Tentukan menu yang aktif berdasarkan current path
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    if (path.startsWith('/materials')) return 'materials';
    if (path.startsWith('/dropdowns')) return 'dropdowns';
    return 'dashboard';
  };

  // Fungsi untuk handle logout
  const handleLogout = async () => {
    try {
      // Panggil logout API
      await logout();
      
      // Clear user data dari localStorage
      localStorage.removeItem('user');
      
      // Clear user state di App.js
      if (onLogout) onLogout();
      
      // Tampilkan success message
      message.success('Logout berhasil');
      
      // Redirect ke login page
      navigate('/login', { replace: true });
    } catch (error) {
      // Jika logout API gagal, tetap clear localStorage dan redirect
      console.error('Logout error:', error);
      localStorage.removeItem('user');
      if (onLogout) onLogout();
      navigate('/login', { replace: true });
    }
  };

  // Menu items untuk navigation
  const menuItems = [
    {
      key: 'dashboard',
      icon: <HomeOutlined />,
      label: <Link to="/">Dashboard</Link>,
    },
    {
      key: 'materials',
      icon: <AppstoreOutlined />,
      label: <Link to="/materials">Materials</Link>,
    },
    {
      key: 'dropdowns',
      icon: <SettingOutlined />,
      label: <Link to="/dropdowns">Settings</Link>,
    },
  ];

  return (
    <Header style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      background: '#001529',
      padding: '0 20px'
    }}>
      {/* Logo dan Title */}
      <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
        Material Management
      </div>

      {/* Menu Navigation */}
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[getSelectedKey()]}
        items={menuItems}
        style={{ flex: 1, minWidth: 0, marginLeft: '50px' }}
      />

      {/* User info dan Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ color: 'white' }}>
          {user?.name || user?.email}
        </span>
        <Button 
          type="primary" 
          danger 
          icon={<LogoutOutlined />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </Header>
  );
}

export default Navbar;

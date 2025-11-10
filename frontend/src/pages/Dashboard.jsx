import React, { useState, useEffect } from 'react';
import { Layout, Card, Row, Col, Statistic, Spin, message } from 'antd';
import { AppstoreOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getDashboardStats } from '../utils/api';

const { Content } = Layout;

// Halaman Dashboard (Homepage)
// Menampilkan statistik dan katalog material
function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Fetch data statistik saat component dimount
  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fungsi untuk fetch data dari API
  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      // Jika error 401 (Unauthorized), redirect ke login
      if (error.includes('401') || error.includes('Unauthorized')) {
        message.error('Session expired. Please login again.');
        localStorage.removeItem('user');
        if (onLogout) onLogout(); // Clear user state di App.js
        navigate('/login', { replace: true });
      } else {
        message.error('Failed to load data: ' + error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Navbar */}
      <Navbar user={user} onLogout={onLogout} />

      {/* Main Content */}
      <Content style={{ padding: '24px' }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: '24px' }}>
          <h1>Welcome, {user?.name}!</h1>
          <p style={{ color: '#888' }}>Here's your material management overview</p>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          {/* Total Materials */}
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="Total Materials"
                value={stats?.totalMaterials || 0}
                prefix={<AppstoreOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>

          {/* Active Materials */}
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="Active Materials"
                value={stats?.activeMaterials || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>

          {/* Divisions */}
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="Divisions"
                value={stats?.totalDivisions || 0}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Materials by Division */}
        <Card title="Materials by Division" style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            {stats?.materialsByDivision?.map((item, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <h3 style={{ margin: 0 }}>{item.count}</h3>
                  <p style={{ margin: 0, color: '#888' }}>
                    {item.division || 'Unknown'}
                  </p>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Recent Materials Catalog */}
        <Card title="Recent Materials" style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            {stats?.recentMaterials?.map((material) => (
              <Col xs={24} sm={12} md={8} lg={6} key={material._id}>
                <Card
                  hoverable
                  cover={
                    material.images && material.images.length > 0 ? (
                      <img
                        alt={material.materialName}
                        src={`http://localhost:5001${material.images[0].url}`}
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        height: '200px',
                        background: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999'
                      }}>
                        No Image
                      </div>
                    )
                  }
                >
                  <Card.Meta
                    title={material.materialName}
                    description={
                      <>
                        <div><strong>No:</strong> {material.materialNumber}</div>
                        <div><strong>Division:</strong> {material.divisionId?.label}</div>
                      </>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>

          {/* Empty State */}
          {(!stats?.recentMaterials || stats.recentMaterials.length === 0) && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <p>No materials yet. Please add new materials.</p>
            </div>
          )}
        </Card>
      </Content>
    </Layout>
  );
}

export default Dashboard;

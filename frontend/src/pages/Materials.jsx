import React, { useState, useEffect } from 'react';
import { Layout, Table, Button, Input, Select, Space, message, Popconfirm, Tag, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import Navbar from '../components/Navbar';
import MaterialForm from '../components/MaterialForm';
import { getMaterials, deleteMaterial, getDropdowns, toggleMaterialStatus } from '../utils/api';

const { Content } = Layout;

// Halaman Materials
// Menampilkan tabel materials dengan fitur search, filter, dan CRUD
function Materials({ user, onLogout }) {
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [placementFilter, setPlacementFilter] = useState('');
  
  // Dropdown options
  const [divisions, setDivisions] = useState([]);
  const [placements, setPlacements] = useState([]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  // Fetch data saat component dimount atau filter berubah
  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchMaterials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search, divisionFilter, placementFilter]);

  // Fungsi fetch dropdowns
  const fetchDropdowns = async () => {
    try {
      const [divData, placeData] = await Promise.all([
        getDropdowns('division'),
        getDropdowns('placement')
      ]);
      setDivisions(divData);
      setPlacements(placeData);
    } catch (error) {
      message.error('Gagal memuat dropdown: ' + error);
    }
  };

  // Fungsi fetch materials dengan filter
  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
      };
      
      if (search) params.search = search;
      if (divisionFilter) params.divisionId = divisionFilter;
      if (placementFilter) params.placementId = placementFilter;

      const data = await getMaterials(params);
      setMaterials(data.materials);
      setTotal(data.total);
    } catch (error) {
      message.error('Gagal memuat materials: ' + error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete material
  const handleDelete = async (id) => {
    try {
      await deleteMaterial(id);
      message.success('Material deleted successfully');
      fetchMaterials();
    } catch (error) {
      message.error('Failed to delete material: ' + error);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await toggleMaterialStatus(id);
      message.success(`Material ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchMaterials();
    } catch (error) {
      message.error('Failed to toggle status: ' + error);
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setSearch(value);
    setPage(1); // Reset ke halaman pertama
  };

  // Handle open modal
  const handleOpenModal = (material = null) => {
    setEditingMaterial(material);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMaterial(null);
  };

  const handleSuccess = () => {
    fetchMaterials();
  };

  // Table columns
  const columns = [
    {
      title: 'No',
      key: 'no',
      width: 60,
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: 'Material Name',
      dataIndex: 'materialName',
      key: 'materialName',
      width: 200,
    },
    {
      title: 'Master Material Number',
      dataIndex: 'materialNumber',
      key: 'materialNumber',
      width: 180,
    },
    {
      title: 'Material Owner (Division)',
      dataIndex: ['divisionId', 'label'],
      key: 'division',
      width: 180,
    },
    {
      title: 'Placement',
      dataIndex: ['placementId', 'label'],
      key: 'placement',
      width: 150,
    },
    {
      title: 'Function/Purpose',
      dataIndex: 'function',
      key: 'function',
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: 'Images',
      dataIndex: 'images',
      key: 'images',
      width: 80,
      render: (images) => images?.length || 0,
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color={record.isActive ? 'green' : 'red'}>
            {record.isActive ? 'Active' : 'Inactive'}
          </Tag>
          <Switch
            size="small"
            checked={record.isActive}
            onChange={() => handleToggleStatus(record._id, record.isActive)}
            checkedChildren="ON"
            unCheckedChildren="OFF"
          />
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleOpenModal(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Material"
            description="Are you sure you want to delete this material?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Navbar */}
      <Navbar user={user} onLogout={onLogout} />

      {/* Main Content */}
      <Content style={{ padding: '24px' }}>
        <div style={{ background: '#fff', padding: '24px', borderRadius: '8px' }}>
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <h1>Materials Management</h1>
            <p style={{ color: '#888' }}>Manage all your materials here</p>
          </div>

          {/* Filters and Search */}
          <Space style={{ marginBottom: '16px', width: '100%' }} direction="vertical">
            <Space wrap>
              {/* Create Button */}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleOpenModal()}
              >
                Create Material
              </Button>

              {/* Search */}
              <Input
                placeholder="Search by material name or number"
                allowClear
                prefix={<SearchOutlined />}
                style={{ width: 300 }}
                onPressEnter={(e) => handleSearch(e.target.value)}
                onChange={(e) => {
                  if (!e.target.value) handleSearch('');
                }}
              />

              {/* Division Filter */}
              <Select
                placeholder="Filter by Material Owner"
                allowClear
                style={{ width: 220 }}
                onChange={(value) => {
                  setDivisionFilter(value || '');
                  setPage(1);
                }}
              >
                {divisions.map(div => (
                  <Select.Option key={div._id} value={div._id}>
                    {div.label}
                  </Select.Option>
                ))}
              </Select>

              {/* Placement Filter */}
              <Select
                placeholder="Filter by Placement"
                allowClear
                style={{ width: 200 }}
                onChange={(value) => {
                  setPlacementFilter(value || '');
                  setPage(1);
                }}
              >
                {placements.map(place => (
                  <Select.Option key={place._id} value={place._id}>
                    {place.label}
                  </Select.Option>
                ))}
              </Select>
            </Space>
          </Space>

          {/* Table */}
          <Table
            columns={columns}
            dataSource={materials}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} materials`,
              onChange: (page, pageSize) => {
                setPage(page);
                setPageSize(pageSize);
              },
            }}
          />
        </div>
      </Content>

      {/* Material Form Modal */}
      <MaterialForm
        visible={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        editingMaterial={editingMaterial}
      />
    </Layout>
  );
}

export default Materials;

import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Table, Button, Input, Space, message, Modal, Form, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Navbar from '../components/Navbar';
import { getDropdowns, createDropdown, updateDropdown, deleteDropdown } from '../utils/api';

const { Content } = Layout;

// Halaman Dropdowns Management
// Mengelola opsi dropdown untuk Division dan Placement
function Dropdowns({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('division');
  const [loading, setLoading] = useState(false);
  const [divisions, setDivisions] = useState([]);
  const [placements, setPlacements] = useState([]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  // Fetch data saat component dimount atau tab berubah
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Fungsi fetch data berdasarkan tipe
  const fetchData = async () => {
    setLoading(true);
    try {
      const divData = await getDropdowns('division');
      const placeData = await getDropdowns('placement');
      setDivisions(divData);
      setPlacements(placeData);
    } catch (error) {
      message.error('Gagal memuat data: ' + error);
    } finally {
      setLoading(false);
    }
  };

  // Handle create/edit
  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      form.setFieldsValue(item);
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      // Auto-generate value from label (lowercase, replace spaces with hyphens)
      const generatedValue = values.label.toLowerCase().replace(/\s+/g, '-');
      
      const data = {
        label: values.label,
        value: generatedValue,
        type: activeTab,
      };

      if (editingItem) {
        // Update
        await updateDropdown(editingItem._id, data);
        message.success('Option updated successfully');
      } else {
        // Create
        await createDropdown(data);
        message.success('Option added successfully');
      }

      handleCloseModal();
      fetchData();
    } catch (error) {
      message.error('Failed to save option: ' + error);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await deleteDropdown(id);
      message.success('Option deleted successfully');
      fetchData();
    } catch (error) {
      message.error('Failed to delete option: ' + error);
    }
  };

  // Table columns
  const columns = [
    {
      title: 'No',
      key: 'no',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Name',
      dataIndex: 'label',
      key: 'label',
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
            title="Delete Option"
            description="Are you sure you want to delete this option?"
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

  // Tabs items
  const tabItems = [
    {
      key: 'division',
      label: 'Material Owner (Division)',
      children: (
        <>
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f7ff', borderRadius: '4px' }}>
            <strong>Material Owner (Division)</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#666' }}>
              Division or department that owns the material
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ marginBottom: '16px' }}
            onClick={() => handleOpenModal()}
          >
            Add Material Owner
          </Button>
          <Table
            columns={columns}
            dataSource={divisions}
            rowKey="_id"
            loading={loading}
            pagination={false}
          />
        </>
      ),
    },
    {
      key: 'placement',
      label: 'Material Placement',
      children: (
        <>
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f7ff', borderRadius: '4px' }}>
            <strong>Material Placement</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#666' }}>
              Physical location where the material is stored
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ marginBottom: '16px' }}
            onClick={() => handleOpenModal()}
          >
            Add Placement Location
          </Button>
          <Table
            columns={columns}
            dataSource={placements}
            rowKey="_id"
            loading={loading}
            pagination={false}
          />
        </>
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
            <h1>Dropdown Management</h1>
            <p style={{ color: '#888' }}>
              Manage dropdown options for Material Owner (Division) and Material Placement.
              These options will be used when creating or editing materials.
            </p>
          </div>

          {/* Tabs */}
          <Tabs
            activeKey={activeTab}
            items={tabItems}
            onChange={setActiveTab}
          />
        </div>
      </Content>

      {/* Modal Form */}
      <Modal
        title={editingItem ? `Edit ${activeTab === 'division' ? 'Material Owner' : 'Placement'}` : `Add New ${activeTab === 'division' ? 'Material Owner' : 'Placement'}`}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Name"
            name="label"
            rules={[{ required: true, message: 'Name is required!' }]}
            extra={activeTab === 'division' ? 'Example: IT Department, HR Division' : 'Example: Warehouse A, Storage Room 101'}
          >
            <Input placeholder={activeTab === 'division' ? 'IT Department' : 'Warehouse A'} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingItem ? 'Update' : 'Create'}
              </Button>
              <Button onClick={handleCloseModal}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

export default Dropdowns;

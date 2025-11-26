import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Upload, Button, message, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { createMaterial, updateMaterial, uploadMaterialImages, deleteMaterialImage, getDropdowns } from '../utils/api';
import { filterHiddenDropdowns } from '../utils/dropdownFilter';

const { TextArea } = Input;

// Component MaterialForm
// Form untuk create dan edit material dengan upload gambar
function MaterialForm({ visible, onClose, onSuccess, editingMaterial }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [divisions, setDivisions] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  // Fetch dropdowns
  useEffect(() => {
    if (visible) {
      fetchDropdowns();
      if (editingMaterial) {
        // Set form values untuk edit
        form.setFieldsValue({
          materialName: editingMaterial.materialName,
          materialNumber: editingMaterial.materialNumber,
          divisionId: editingMaterial.divisionId?.id || editingMaterial.divisionId?._id,
          placementId: editingMaterial.placementId?.id || editingMaterial.placementId?._id,
          function: editingMaterial.function,
        });
        setExistingImages(editingMaterial.images || []);
      } else {
        form.resetFields();
        setFileList([]);
        setExistingImages([]);
      }
    }
  }, [visible, editingMaterial, form]);

  const fetchDropdowns = async () => {
    try {
      const [divData, placeData] = await Promise.all([
        getDropdowns('division', false),
        getDropdowns('placement', false)
      ]);
      // Filter out hidden dropdowns using utility function
      setDivisions(filterHiddenDropdowns(divData));
      setPlacements(filterHiddenDropdowns(placeData));
    } catch (error) {
      message.error('Failed to load dropdowns: ' + error);
    }
  };

  const handleSubmit = async (values) => {
    console.log('Submitting material data:', values);
    setLoading(true);
    try {
      let material;
      
      if (editingMaterial) {
        const materialId = editingMaterial.id || editingMaterial._id;
        material = await updateMaterial(materialId, values);
        message.success('Material updated successfully');
      } else {
        console.log('Creating new material with data:', values);
        material = await createMaterial(values);
        console.log('Material created:', material);
        message.success('Material created successfully');
      }

      if (fileList.length > 0) {
        const formData = new FormData();
        fileList.forEach(file => {
          const rawFile = file.originFileObj || file;
          console.log('Appending file:', rawFile.name, rawFile.type, rawFile.size);
          formData.append('images', rawFile);
        });

        const materialId = material.id || material._id;
        console.log('Uploading', fileList.length, 'images for material:', materialId);
        await uploadMaterialImages(materialId, formData);
        message.success('Images uploaded successfully');
      }

      onSuccess();
      handleClose();
    } catch (error) {
      message.error('Failed to save material: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageUrl) => {
    try {
      const materialId = editingMaterial.id || editingMaterial._id;
      await deleteMaterialImage(materialId, imageUrl);
      setExistingImages(existingImages.filter(img => img.url !== imageUrl));
      message.success('Image deleted successfully');
    } catch (error) {
      message.error('Failed to delete image: ' + error);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setFileList([]);
    setExistingImages([]);
    onClose();
  };

  // Upload props
  const uploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return false;
      }

      // Validate file size (max 5MB)
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Image must be smaller than 5MB!');
        return false;
      }

      // Check total images
      const totalImages = existingImages.length + fileList.length + 1;
      if (totalImages > 5) {
        message.error('Maximum 5 images allowed!');
        return false;
      }

      setFileList([...fileList, file]);
      return false; // Prevent auto upload
    },
    fileList,
  };

  return (
    <Modal
      title={editingMaterial ? 'Edit Material' : 'Create New Material'}
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        {/* Material Name */}
        <Form.Item
          label="Material Name"
          name="materialName"
          rules={[{ required: true, message: 'Please input material name!' }]}
        >
          <Input placeholder="Enter material name" />
        </Form.Item>

        {/* Master Material Number */}
        <Form.Item
          label="Master Material Number"
          name="materialNumber"
          rules={[{ required: true, message: 'Please input material number!' }]}
        >
          <Input placeholder="Enter unique material number" />
        </Form.Item>

        {/* Material Owner (Division) */}
        <Form.Item
          label="Material Owner (Division)"
          name="divisionId"
          rules={[{ required: true, message: 'Please select material owner!' }]}
        >
          <Select placeholder="Select material owner">
            {divisions.filter(div => div.id || div._id).map(div => (
              <Select.Option key={div.id || div._id} value={div.id || div._id}>
                {div.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Placement */}
        <Form.Item
          label="Material Placement"
          name="placementId"
          rules={[{ required: true, message: 'Please select placement!' }]}
        >
          <Select placeholder="Select placement location">
            {placements.filter(place => place.id || place._id).map(place => (
              <Select.Option key={place.id || place._id} value={place.id || place._id}>
                {place.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Function/Purpose */}
        <Form.Item
          label="Function / Purpose"
          name="function"
        >
          <TextArea 
            rows={3} 
            placeholder="Describe the function or purpose of this material"
          />
        </Form.Item>

        {/* Existing Images */}
        {editingMaterial && existingImages.length > 0 && (
          <Form.Item label="Current Images">
            <Space wrap>
              {existingImages.map((img) => (
                <div key={img.url} style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={`http://localhost:5001${img.url}`}
                    alt="Material"
                    style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                  />
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    style={{ position: 'absolute', top: 4, right: 4 }}
                    onClick={() => handleDeleteImage(img.url)}
                  />
                </div>
              ))}
            </Space>
          </Form.Item>
        )}

        {/* Upload New Images */}
        <Form.Item 
          label={editingMaterial ? "Add More Images" : "Upload Images"}
          extra="Maximum 5 images, max 5MB each. Supported formats: JPG, PNG"
        >
          <Upload
            {...uploadProps}
            listType="picture-card"
          >
            {(existingImages.length + fileList.length) < 5 && (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        {/* Buttons */}
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingMaterial ? 'Update Material' : 'Create Material'}
            </Button>
            <Button onClick={handleClose}>
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default MaterialForm;

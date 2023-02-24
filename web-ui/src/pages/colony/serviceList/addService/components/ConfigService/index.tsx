
import styles from './index.less'
import React, { useState, useEffect, useRef } from 'react';
import { Menu, Form, Table, Button, Typography, Popconfirm, InputNumber, Input, Tooltip, Modal } from 'antd';
import { getServiceConfAPI } from '@/services/ant-design-pro/colony';


const ConfigService:React.FC<{setPresetConfListToParams: any}> = ( setPresetConfListToParams )=>{

    const [form] = Form.useForm()
    const [currentConfList, setCurrentConfList] = useState<any[]>();
    const [loading, setLoading] = useState(false);
    const [serviceId, setServiceId] = useState(null);
    const [editingKey, setEditingKey] = useState('');
    const [confData, setConfData] = useState({});
    // const [addConfigForm] = Form.useForm()
    // const [isModalOpen, setIsModalOpen] = useState(false);
    
    const getData = JSON.parse(sessionStorage.getItem('colonyData') || '{}')

    const serviceMenu = getData.selectedServiceList.map((sItem: { label: any; id: any; })=>{
        return {
            label: sItem.label,
            key: sItem.id + '',
        }
    })|| []

    const updateConfig = (value:any) => {
        sessionStorage.setItem('allConfData', JSON.stringify(value))
        setConfData(value)
    }


    useEffect(()=>{
        if(serviceMenu && serviceMenu.length>0){
            setServiceId(serviceMenu[0].key)
            const params = {
                serviceId: serviceMenu[0].key,
                inWizard: true
            }
            getConfListData(params)
        }
    },[])
    

    const getConfListData = async (params: any) => {
        if(confData && confData[params.serviceId]){
            setCurrentConfList(confData[params.serviceId])
            return
        }else{
            setLoading(true)
            const result: API.ConfList =  await getServiceConfAPI(params);
            setLoading(false)
            const confs = result?.data?.confs?.map(item=>{
                    return {
                        sourceValue: item.recommendExpression,
                        ...item,
                    }
                })
            setCurrentConfList(confs)
            let confResult = {...(confData||{}),[params.serviceId]:confs}
            updateConfig(confResult)
        }
      };

    const onSelectService = function(value: any){
        // if(serviceId){// 保存切换前的数据
        //     let confResult = {...confData,[serviceId]:currentConfList}
        //     updateConfig(confResult)
        // }
        setServiceId(value.key)
        const params = {
            serviceId: value.key,
            inWizard: true
        }
        getConfListData(params)
    }

    const isEditing = (record: Item) => record.name === editingKey;

    const edit = (record: Item) => {
        form.setFieldsValue({ ...record });
        setEditingKey(record.name || '');
    };
    
    const cancel = () => {
        setEditingKey('');
    };

    const resetSource = (record: Item) => {
        console.log('---record: ', record);
        const row = {...record, recommendExpression: record.sourceValue}
        const newData = [...(currentConfList||[])];
        const index = newData.findIndex(item => row.name === item.name);
        if (index > -1) {
            const item = newData[index];
            newData.splice(index, 1, {
            ...item,
            ...row,
            });
            setCurrentConfList(newData);
            setEditingKey('');
        }else{
            newData.push(row);
            setCurrentConfList(newData);
            setEditingKey('');
        }
        let confResult = serviceId ? {...confData,[serviceId]:newData} : {...confData}
        updateConfig(confResult)
        
    }
    const save = async (key: React.Key) => {        
        try {
            const row = (await form.validateFields()) as Item;
            const newData = [...(currentConfList||[])];
            const index = newData.findIndex(item => key === item.name);
            if (index > -1) {
                const item = newData[index];
                newData.splice(index, 1, {
                ...item,
                ...row,
                });
                setCurrentConfList(newData);
                setEditingKey('');
            }else{
                newData.push(row);
                setCurrentConfList(newData);
                setEditingKey('');
            }
            let confResult = serviceId ? {...confData,[serviceId]:newData} : {...confData}
            updateConfig(confResult)
        } catch (errInfo) {
            console.log('Validate Failed:', errInfo);
        }
    }

    interface Item {
        name: string;
        recommendExpression: string;
        sourceValue: string;
    }

    interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
        editing: boolean;
        dataIndex: string;
        title: any;
        inputType: 'number' | 'text';
        record: Item;
        index: number;
        children: React.ReactNode;
      }

    const EditableCell: React.FC<EditableCellProps> = ({
        editing,
        dataIndex,
        title,
        inputType,
        record,
        index,
        children,
        ...restProps
      }) => {
        const inputNode = inputType === 'number' ? <InputNumber /> : <Input />;
      
        return (
          <td {...restProps}>
            {editing ? (
              <Form.Item
                name={dataIndex}
                style={{ margin: 0 }}
                rules={[
                  {
                    required: true,
                    message: `请输入 ${title}!`,
                  },
                ]}
              >
                {inputNode}
              </Form.Item>
            ) : (
              children
            )}
          </td>
        );
      };

    const configColumns = [
        {
            title: '配置项',
            dataIndex: 'name',
            editable: false,
        },{
            title: '值',
            dataIndex: 'recommendExpression',
            editable: true,
            render: (_: any, record: Item) => {
                // console.log('record',record);
                const hasEdit = (record.sourceValue != record.recommendExpression);
                return hasEdit ? (
                    <div style={{position:'relative'}}>
                        <Tooltip color="volcano" getPopupContainer={(trigger) => trigger.parentNode} autoAdjustOverflow={false} arrowPointAtCenter={true} visible={true} open={true} placement="rightTop" title={()=>{
                            return (
                                <div style={{color:'#fff', fontWeight:'500'}}>已修改</div>
                            )
                        }}>
                        {record.recommendExpression}
                        </Tooltip>
                    </div>
                ) : (
                    <span>{record.recommendExpression}</span>
                );
            },
        },{
            title: '操作',
            dataIndex: 'operation',
            render: (_: any, record: Item) => {
                // console.log('record',record);
                const editable = isEditing(record);
                return editable ? (
                    <span>
                    <Typography.Link onClick={() => save(record.name)} style={{ marginRight: 8 }}>
                        确定
                    </Typography.Link>
                    <Typography.Link onClick={() => cancel()}>
                        取消
                    </Typography.Link>
                    {/* <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
                        <a>取消</a>
                    </Popconfirm> */}
                    </span>
                ) : (
                    <span>
                        <Typography.Link disabled={editingKey !== ''} onClick={() => edit(record)}>
                        编辑
                        </Typography.Link>
                        {
                            (record.sourceValue != record.recommendExpression) && (
                                <Popconfirm title="确定恢复到初始值吗?" onConfirm={()=>resetSource(record)}>
                                    <a style={{display:'inline-block',marginLeft: '20px'}}>恢复初始值</a>
                                </Popconfirm>
                            )
                        }
                    </span>
                );
            },
          },
    ]

    const mergedColumns = configColumns.map(col => {
        if (!col.editable) {
          return col;
        }
        return {
          ...col,
          onCell: (record: Item) => ({
            record,
            inputType: 'text', //col.dataIndex === 'age' ? 'number' : 'text',
            dataIndex: col.dataIndex,
            title: col.title,
            editing: isEditing(record),
          }),
        };
      });

    
    //   const handleOk = () => {
    //     // console.log(form.getFieldsValue());
    //     addConfigForm
    //       .validateFields()
    //       .then(async (values) => {
    //         // const result: API.normalResult = await createNodeAPI({...values, clusterId: getData.clusterId})
    //         // if(result && result.success){
    //         //   message.success('新增成功');
    //         //   getNodeData({ clusterId: getData.clusterId });
    //         //   setIsModalOpen(false);
    //         //   form.resetFields()
    //         // }
    //       })
    //       .catch((err) => {
    //         console.log('err: ', err);
    //       });
    //   };
    
    //   const handleCancel = () => {
    //     addConfigForm.resetFields()
    //     setIsModalOpen(false);
    //   };

    return (
        <div className={styles.CSLayout}>
            <div className={styles.CSLeft}>
                {serviceMenu && serviceMenu[0] && serviceMenu[0].key && (
                    <Menu 
                        mode="inline" 
                        items={serviceMenu} 
                        defaultSelectedKeys={[serviceMenu[0].key]}
                        className={styles.CSLeftMenu} 
                        onSelect={onSelectService} 
                    />
                )}
            </div>
            <div className={styles.CSRight}>
                {/* <div className={styles.CSBtnWrap}>
                    <Button 
                        key="addconfig"
                        type="primary"
                        disabled={!serviceId}
                        onClick={() => {
                            
                        }}
                    >
                    自定义配置项
                    </Button>
                </div> */}
                <div>
                <Form form={form} component={false}>
                    <Table
                        components={{
                            body: {
                                cell: EditableCell,
                            },
                        }}
                        scroll={{
                            y:600
                        }}
                        rowKey="name"
                        pagination={false}
                        bordered
                        loading={loading}
                        dataSource={currentConfList}
                        columns={mergedColumns}
                        rowClassName="editable-row"
                    />
                </Form>
                </div>
            </div>
            {/* <Modal
                key="addconfigmodal"
                title="新增配置项"
                forceRender={true}
                destroyOnClose={true}
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                // footer={null}
            >
                <div>
                <Form
                    form={addConfigForm}
                    key="addconfigform"
                    name="新增配置项"
                    preserve={false}
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    initialValues={{ remember: true }}
                    // onFinish={onFinish}
                    autoComplete="off"
                >
                    <Form.Item
                    label="ip"
                    name="ip"
                    rules={[{ required: true, message: '请输入ip!' }]}
                    >
                    <Input />
                    </Form.Item>

                    <Form.Item
                    label="sshUser"
                    name="sshUser"
                    rules={[{ required: true, message: '请输入sshUser!' }]}
                    >
                    <Input />
                    </Form.Item>

                    <Form.Item
                    label="sshPassword"
                    name="sshPassword"
                    rules={[{ required: true, message: '请输入sshPassword!' }]}
                    >
                    <Input />
                    </Form.Item>

                    <Form.Item
                    label="sshPort"
                    name="sshPort"
                    rules={[{ required: true, message: 'sshPort!' }]}
                    >
                    <Input />
                    </Form.Item>
                </Form>
                </div>
            </Modal> */}
        </div>
    )
}

export default ConfigService;
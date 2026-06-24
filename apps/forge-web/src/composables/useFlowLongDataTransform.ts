import type { FlowLongNodeModel } from './useFlowLongDesigner'

/**
 * flowlong-designer 数据类型定义
 *
 * 注意：FlowLong 引擎的 TaskType 和 NodeSetType 值与前端设计器完全一致，不需要转换！
 *
 * FlowLong TaskType:
 * - major(0) = 发起人/主办
 * - approval(1) = 审批
 * - cc(2) = 抄送
 * - conditionBranch(4) = 条件分支
 *
 * FlowLong NodeSetType:
 * - specifyMembers(1) = 指定成员
 * - supervisor(2) = 主管
 * - role(3) = 角色
 * - initiatorSelected(4) = 发起人自选
 * - initiatorThemselves(5) = 发起人自己
 * - multiLevelSupervisors(6) = 连续多级主管
 * - department(7) = 部门
 */

// flowlong-designer 的节点类型
export interface FlowlongNodeModel {
  nodeName: string
  nodeKey: string
  type: number // 0=发起人, 1=审批人, 2=抄送人, 3=条件, 4=条件路由
  setType?: number // 1=指定成员, 2=主管, 3=角色, 4=发起人自选, 5=发起人自己, 6=审批人自选, 7=连续多级主管, 8=表达式
  nodeAssigneeList?: FlowlongNodeAssignee[]
  examineLevel?: number // 指定主管层级
  directorLevel?: number // 连续主管审批层级
  directorMode?: number // 连续主管审批方式
  selectMode?: number // 发起人自选类型
  termAuto?: boolean // 超时自动审批
  term?: number // 审批期限（小时）
  termMode?: number // 超时后执行类型 0=自动通过, 1=自动拒绝
  examineMode?: number // 多人审批方式 1=依次审批, 2=会签, 3=或签
  userSelectFlag?: boolean // 允许发起人自选抄送人
  expression?: string // 表达式
  conditionNodes?: FlowlongConditionNode[]
  conditionList?: FlowlongCondition[][] // 条件列表（条件组数组）
  childNode?: FlowlongNodeModel
}

export interface FlowlongNodeAssignee {
  id: string
  name: string
}

export interface FlowlongConditionNode {
  nodeName: string
  nodeKey: string
  type: number
  priorityLevel: number
  conditionMode?: number
  conditionList: FlowlongCondition[][]
  childNode?: FlowlongNodeModel
}

export interface FlowlongCondition {
  label: string
  field: string
  operator: string
  value: string
}

export interface FlowlongProcessModel {
  id?: number | string
  name: string
  key: string
  nodeConfig: FlowlongNodeModel
}

/**
 * 数据转换 Hook
 *
 * 设计器格式与 FlowLong 格式基本一致，主要需要：
 * 1. 保持 type 和 setType 值不变
 * 2. 确保 nodeAssigneeList 字段存在（FlowLong 需要）
 */
export function useFlowLongDataTransform() {
  /**
   * 将 flowlong-designer 格式转换为 FlowLong 引擎格式
   *
   * 注意：设计器格式与 FlowLong 格式基本一致，主要是确保必要的字段存在
   */
  const transformDesignerToBackend = (designerModel: FlowlongProcessModel): FlowLongNodeModel => {
    const transformNode = (node: FlowlongNodeModel | undefined): FlowLongNodeModel | undefined => {
      if (!node) return undefined

      const result: FlowLongNodeModel = {
        nodeName: node.nodeName,
        nodeKey: node.nodeKey,
        // 直接使用设计器的 type 值，不转换！FlowLong 使用相同的值
        type: node.type,
        // 保持 setType 不变
        setType: node.setType,
        // 保持 nodeAssigneeList 不变（这是 FlowLong 必需的字段）
        nodeAssigneeList: node.nodeAssigneeList,
        childNode: transformNode(node.childNode)
      }

      // 处理审批节点（type=1）和抄送节点（type=2）的配置
      if (node.type === 1 || node.type === 2) {
        // 审批配置
        if (node.examineMode !== undefined) {
          result.examineMode = node.examineMode
        }
        if (node.termAuto !== undefined) {
          result.termAuto = node.termAuto
        }
        if (node.term !== undefined) {
          result.term = node.term
        }
        if (node.termMode !== undefined) {
          result.termMode = node.termMode
        }
        if (node.userSelectFlag !== undefined) {
          result.userSelectFlag = node.userSelectFlag
        }
        if (node.expression !== undefined) {
          result.expression = node.expression
        }

        // 主管层级
        if (node.examineLevel !== undefined) {
          result.examineLevel = node.examineLevel
        }
        if (node.directorLevel !== undefined) {
          result.directorLevel = node.directorLevel
        }
        if (node.directorMode !== undefined) {
          result.directorMode = node.directorMode
        }
      }

      // 处理条件分支（type=4）
      if (node.type === 4 && node.conditionNodes) {
        result.conditionNodes = node.conditionNodes.map(cn => ({
          nodeName: cn.nodeName,
          nodeKey: cn.nodeKey,
          type: cn.type,
          priorityLevel: cn.priorityLevel,
          conditionMode: cn.conditionMode,
          conditionList: cn.conditionList,
          childNode: transformNode(cn.childNode)
        })) as any
      }

      return result
    }

    return transformNode(designerModel.nodeConfig)!
  }

  /**
   * 将 FlowLong 后端格式转换为 flowlong-designer 格式
   */
  const transformBackendToDesigner = (backendModel: FlowLongNodeModel): FlowlongProcessModel => {
    const transformNode = (node: FlowLongNodeModel | undefined): FlowlongNodeModel | undefined => {
      if (!node) return undefined

      const result: FlowlongNodeModel = {
        nodeName: node.nodeName,
        nodeKey: node.nodeKey,
        // 直接使用后端的 type 值，不转换
        type: node.type,
        setType: node.setType,
        nodeAssigneeList: node.nodeAssigneeList,
        childNode: transformNode(node.childNode)
      }

      // 处理审批配置
      if (node.examineMode !== undefined) {
        result.examineMode = node.examineMode
      }
      if (node.termAuto !== undefined) {
        result.termAuto = node.termAuto
      }
      if (node.term !== undefined) {
        result.term = node.term
      }
      if (node.termMode !== undefined) {
        result.termMode = node.termMode
      }
      if (node.userSelectFlag !== undefined) {
        result.userSelectFlag = node.userSelectFlag
      }
      if (node.expression !== undefined) {
        result.expression = node.expression
      }
      if (node.examineLevel !== undefined) {
        result.examineLevel = node.examineLevel
      }
      if (node.directorLevel !== undefined) {
        result.directorLevel = node.directorLevel
      }
      if (node.directorMode !== undefined) {
        result.directorMode = node.directorMode
      }

      // 处理条件分支
      if (node.type === 4 && node.conditionNodes) {
        result.conditionNodes = node.conditionNodes.map(cn => ({
          nodeName: cn.nodeName,
          nodeKey: cn.nodeKey,
          type: cn.type || 3,
          priorityLevel: cn.priorityLevel || 1,
          conditionMode: cn.conditionMode || 1,
          conditionList: cn.conditionList || [],
          childNode: transformNode(cn.childNode)
        })) as any
      }

      return result
    }

    return {
      name: '',
      key: '',
      nodeConfig: transformNode(backendModel)!
    }
  }

  /**
   * 创建初始模型（发起人节点）
   */
  const createInitialModel = (processKey: string, processName: string): FlowlongProcessModel => {
    return {
      name: processName,
      key: processKey,
      nodeConfig: {
        nodeName: '发起人',
        nodeKey: 'start_' + Date.now(),
        type: 0, // FlowLong TaskType.major = 0
        nodeAssigneeList: [],
        childNode: undefined
      }
    }
  }

  return {
    transformDesignerToBackend,
    transformBackendToDesigner,
    createInitialModel
  }
}
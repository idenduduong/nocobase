import type { Dispatch, SetStateAction } from 'react';
import { CollectionFieldOptions } from '../collection-manager';

export interface VariablesContextType {
  /**
   * 解析变量所需的上下文数据
   *
   * ```ts
   * const ctx = {
   *  $user: {
   *   id: 1,
   *   name: 'test',
   *  }
   * }
   * ```
   */
  ctx: Record<string, any>;
  /**
   * 更新上下文
   */
  setCtx: Dispatch<SetStateAction<Record<string, any>>>;
  /**
   * 解析变量
   * @param str 一个变量字符串，例如：`{{ $user.name }}`
   * @returns 变量解析后的值
   *
   * ```ts
   * const value = await parseVariable('{{ $user.name }}');
   * console.log(value); // test
   * ```
   */
  parseVariable: (str: string, localVariable?: VariableOption) => Promise<any>;
  /**
   * 注册变量
   * @param variableOption 新变量的配置
   * @returns void
   *
   * ```ts
   * registerVariable({
   *  name: '$user',
   *  collectionName: 'users',
   *  ctx: {
   *    id: 1,
   *    name: 'test',
   *  },
   * });
   * ```
   */
  registerVariable: (variableOption: VariableOption) => void;
  /**
   * 获取变量的配置
   * @param variableName 变量的名称，例如：`$user`
   * @returns 变量的配置
   */
  getVariable: (variableName: string) => VariableOption;
  getCollectionField: (collectionName: string) => CollectionFieldOptions;
}

export interface VariableOption {
  /** 变量的表示，例如：`$user` */
  name: string;
  /** 变量的值 */
  ctx: {
    id?: number | string;
    [key: string]: any;
  };
  /** 变量所对应的数据表的名称 */
  collectionName?: string;
}

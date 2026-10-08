import { logger } from '@api/infrastructure/logger';
import {
  type CookSpaceAdminRow,
  cookSpaceRepository,
} from '@api/infrastructure/repository/cook/space-repository';
import { userRepository } from '@api/infrastructure/repository/user-repository';
import type {
  CookSpaceDetail,
  CookSpaceType,
  CreateCookSpaceBody,
  ListCookSpacesQuery,
  RenameCookSpaceBody,
} from '@api/interface/schema/cook/space-schema';
import {
  BadRequestException,
  ConflictException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';
import { formatDateTime } from '@api/shared/util/date';
import { isUniqueViolationError } from '@api/shared/util/db';

const PERSONAL_OWNER_UNIQUE = 'cook_space_personal_owner_user_id_unique';

const normalizeName = (name: string): string => {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 64) {
    throw new BadRequestException(
      '名称长度须为1-64个字符',
      ERROR_CODES.COOK_SPACE_NAME_INVALID,
    );
  }
  return trimmed;
};

const toCookSpaceDetail = (row: CookSpaceAdminRow): CookSpaceDetail => ({
  id: row.id,
  name: row.name,
  type: row.type as CookSpaceType,
  ownerUserId: row.ownerUserId,
  ownerName: row.ownerName,
  archived: row.archivedAt !== null,
  archivedAt: row.archivedAt ? formatDateTime(row.archivedAt) : null,
  createdAt: formatDateTime(row.createdAt),
  updatedAt: formatDateTime(row.updatedAt),
});

const findCookSpaceOrThrow = async (id: string): Promise<CookSpaceAdminRow> => {
  const row = await cookSpaceRepository.findById(id);
  if (!row) {
    throw new NotFoundException('空间不存在', ERROR_CODES.COOK_SPACE_NOT_FOUND);
  }
  return row;
};

export const listAdminCookSpaces = async (
  query: ListCookSpacesQuery,
): Promise<{
  items: CookSpaceDetail[];
  total: number;
  page: number;
  pageSize: number;
}> => {
  const where = cookSpaceRepository.buildWhereClause(query);
  const offset = (query.page - 1) * query.pageSize;

  const [rows, totalRows] = await Promise.all([
    cookSpaceRepository.listPagination(where, query.pageSize, offset),
    cookSpaceRepository.count(where),
  ]);

  return {
    items: rows.map(toCookSpaceDetail),
    total: totalRows[0]?.total ?? 0,
    page: query.page,
    pageSize: query.pageSize,
  };
};

export const getAdminCookSpace = async (
  id: string,
): Promise<CookSpaceDetail> => {
  const row = await findCookSpaceOrThrow(id);
  return toCookSpaceDetail(row);
};

export const createAdminCookSpace = async (
  body: CreateCookSpaceBody,
): Promise<CookSpaceDetail> => {
  const name = normalizeName(body.name);
  const owner = await userRepository.findById(body.ownerUserId);
  if (!owner) {
    throw new NotFoundException('用户不存在', ERROR_CODES.USER_NOT_FOUND);
  }
  if (owner.banned) {
    throw new BadRequestException(
      '所有者已封禁',
      ERROR_CODES.COOK_SPACE_OWNER_BANNED,
    );
  }

  let createdId: string;
  try {
    const created = await cookSpaceRepository.createWithOwner({
      type: body.type,
      name,
      ownerUserId: body.ownerUserId,
    });
    createdId = created.id;
  } catch (error) {
    if (isUniqueViolationError(error, PERSONAL_OWNER_UNIQUE)) {
      throw new ConflictException(
        '该用户已有个人空间',
        ERROR_CODES.COOK_SPACE_PERSONAL_ALREADY_EXISTS,
      );
    }
    throw error;
  }

  logger.info('Created cook space {spaceId} for owner {ownerUserId}', {
    spaceId: createdId,
    ownerUserId: body.ownerUserId,
  });

  const row = await findCookSpaceOrThrow(createdId);
  return toCookSpaceDetail(row);
};

export const renameAdminCookSpace = async (
  id: string,
  body: RenameCookSpaceBody,
): Promise<CookSpaceDetail> => {
  await findCookSpaceOrThrow(id);
  const name = normalizeName(body.name);
  const updated = await cookSpaceRepository.updateName(id, name);
  if (!updated) {
    throw new NotFoundException('空间不存在', ERROR_CODES.COOK_SPACE_NOT_FOUND);
  }

  logger.info('Renamed cook space {spaceId}', { spaceId: id });
  const row = await findCookSpaceOrThrow(id);
  return toCookSpaceDetail(row);
};

export const archiveAdminCookSpace = async (
  id: string,
): Promise<CookSpaceDetail> => {
  const current = await findCookSpaceOrThrow(id);
  if (current.archivedAt !== null) {
    return toCookSpaceDetail(current);
  }

  const updated = await cookSpaceRepository.setArchivedAt(id, new Date());
  if (!updated) {
    throw new NotFoundException('空间不存在', ERROR_CODES.COOK_SPACE_NOT_FOUND);
  }

  logger.info('Archived cook space {spaceId}', { spaceId: id });
  const row = await findCookSpaceOrThrow(id);
  return toCookSpaceDetail(row);
};

export const restoreAdminCookSpace = async (
  id: string,
): Promise<CookSpaceDetail> => {
  const current = await findCookSpaceOrThrow(id);
  if (current.archivedAt === null) {
    return toCookSpaceDetail(current);
  }

  const updated = await cookSpaceRepository.setArchivedAt(id, null);
  if (!updated) {
    throw new NotFoundException('空间不存在', ERROR_CODES.COOK_SPACE_NOT_FOUND);
  }

  logger.info('Restored cook space {spaceId}', { spaceId: id });
  const row = await findCookSpaceOrThrow(id);
  return toCookSpaceDetail(row);
};

import {
  Injectable,
  Scope,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { EntityTarget, ObjectLiteral, QueryRunner, Repository } from 'typeorm';

/**
 * F16: REQUEST-scoped service that exposes repositories bound to the
 * QueryRunner set up by TenantInterceptor. This ensures every DB query
 * executed within a request uses the connection where
 * `SET search_path TO "<tenant_schema>", public` was already applied.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantRepositoryService {
  constructor(@Inject(REQUEST) private readonly request: Record<string, any>) {}

  getRepository<T extends ObjectLiteral>(entity: EntityTarget<T>): Repository<T> {
    const queryRunner = this.request['queryRunner'] as QueryRunner | undefined;
    if (!queryRunner) {
      throw new InternalServerErrorException(
        'TenantRepositoryService: no QueryRunner found in request context — ' +
          'ensure TenantInterceptor ran before this service is used',
      );
    }
    return queryRunner.manager.getRepository(entity);
  }
}

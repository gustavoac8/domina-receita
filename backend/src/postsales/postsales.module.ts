import { Module } from '@nestjs/common';
import { PostsalesController } from './postsales.controller';
import { PostsalesService } from './postsales.service';

@Module({
  controllers: [PostsalesController],
  providers: [PostsalesService],
})
export class PostsalesModule {}

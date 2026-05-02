import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';

@Controller('lists')
@UseGuards(JwtAuthGuard)
export class ListsController {
  constructor(private listsService: ListsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateListDto, @Request() req) {
    return this.listsService.create(req.user.id, dto);
  }

  @Get('board/:boardId')
  findByBoard(@Param('boardId') boardId: string, @Request() req) {
    return this.listsService.findByBoard(req.user.id, boardId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateListDto, @Request() req) {
    return this.listsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req) {
    await this.listsService.delete(req.user.id, id);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Controller('boards')
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(private boardsService: BoardsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateBoardDto, @Request() req) {
    return this.boardsService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string | undefined, @Request() req) {
    return this.boardsService.findAll(req.user.id, organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.boardsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBoardDto, @Request() req) {
    return this.boardsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req) {
    await this.boardsService.delete(req.user.id, id);
  }
}

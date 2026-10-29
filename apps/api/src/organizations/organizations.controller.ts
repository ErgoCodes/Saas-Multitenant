import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AddOrganizationMemberDto } from './dto/add-member.dto';
import { UpdateOrganizationMemberDto } from './dto/update-member.dto';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @Get()
  findAll(@Request() req) {
    return this.organizationsService.findAllForUser(req.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateOrganizationDto, @Request() req) {
    return this.organizationsService.create(req.user.id, dto);
  }

  @Get(':id/members')
  findMembers(@Param('id') id: string, @Request() req) {
    return this.organizationsService.findMembers(req.user.id, id);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  addMember(
    @Param('id') id: string,
    @Body() dto: AddOrganizationMemberDto,
    @Request() req,
  ) {
    return this.organizationsService.addMember(req.user.id, id, dto);
  }

  @Patch(':id/members/:userId')
  updateMemberRole(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateOrganizationMemberDto,
    @Request() req,
  ) {
    return this.organizationsService.updateMemberRole(req.user.id, id, targetUserId, dto);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @Request() req,
  ) {
    await this.organizationsService.removeMember(req.user.id, id, targetUserId);
  }
}

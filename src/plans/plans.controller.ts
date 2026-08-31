import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  create(@Body() createPlanDto: CreatePlanDto) {
    return this.plansService.createPlan(createPlanDto);
  }

  @Get()
  findAll() {
    return this.plansService.getPlans();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plansService.getPlan(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    return this.plansService.updatePlan(id, updatePlanDto);
  }

  @Put(':id')
  archivePlan(@Param('id') id: string) {
    return this.plansService.archivePlan(id);
  }

  @Put(':id')
  activatePlan(@Param('id') id: string) {
    return this.plansService.activatePlan(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.plansService.deleteProduct(id);
  }
}

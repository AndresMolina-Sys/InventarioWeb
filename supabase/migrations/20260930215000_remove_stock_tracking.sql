-- Remove stock tracking now that this app is an internal article register.
drop index public.inventory_items_user_quantity_idx;
drop table public.stock_movements;
drop function public.apply_stock_movement();
alter table public.inventory_items
  drop column quantity,
  drop column reorder_level;

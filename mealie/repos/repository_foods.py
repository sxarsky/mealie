from pydantic import UUID4
from sqlalchemy import func, select

from mealie.db.models.recipe.ingredient import IngredientFoodModel, RecipeIngredientModel
from mealie.schema.recipe.recipe_ingredient import IngredientFood

from .repository_generic import GroupRepositoryGeneric


class RepositoryFood(GroupRepositoryGeneric[IngredientFood, IngredientFoodModel]):
    def _get_food(self, id: UUID4) -> IngredientFoodModel:
        stmt = select(self.model).filter_by(**self._filter_builder(**{"id": id}))
        return self.session.execute(stmt).scalars().one()

    def count_affected_recipes(self, id: UUID4) -> int:
        """Number of distinct recipes whose ingredients reference the given food."""
        stmt = select(func.count(func.distinct(RecipeIngredientModel.recipe_id))).filter(
            RecipeIngredientModel.food_id == id
        )
        return self.session.execute(stmt).scalar() or 0

    def merge(self, from_food: UUID4, to_food: UUID4) -> IngredientFood | None:
        from_model = self._get_food(from_food)
        to_model = self._get_food(to_food)

        to_model.ingredients += from_model.ingredients

        try:
            self.session.delete(from_model)
            self.session.commit()
        except Exception as e:
            self.session.rollback()
            raise e

        return self.get_one(to_food)

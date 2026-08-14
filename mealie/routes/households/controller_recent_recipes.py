from functools import cached_property

from fastapi import APIRouter

from mealie.repos.all_repositories import get_repositories
from mealie.repos.repository_recipes import RepositoryRecipes
from mealie.routes._base import controller
from mealie.routes._base.base_controllers import BaseUserController
from mealie.schema.recipe.recipe import RecipePagination
from mealie.schema.response.pagination import OrderDirection, PaginationQuery

router = APIRouter(prefix="/households/recent-recipes", tags=["Households: Recent Recipes"])

# Cap the number of recent recipes a single request can ask for, so the
# endpoint stays cheap regardless of what the client sends.
DEFAULT_LIMIT = 25
MAX_LIMIT = 100


@controller(router)
class HouseholdRecentRecipesController(BaseUserController):
    @cached_property
    def recipes(self) -> RepositoryRecipes:
        return get_repositories(self.session, group_id=None, household_id=None).recipes

    @router.get("", response_model=RecipePagination)
    def get_recent(self, limit: int | None = None):
        """
        Return the most recently created recipes as a lightweight listing,
        newest first. Handy for "recently added" widgets and home screens.
        """
        # Guard against missing or out-of-range limits before hitting the repo.
        per_page = limit if limit else DEFAULT_LIMIT
        per_page = max(1, min(per_page, MAX_LIMIT))

        return self.recipes.by_user(self.user.id).page_all(
            pagination=PaginationQuery(
                page=1,
                per_page=per_page,
                order_by="created_at",
                order_direction=OrderDirection.desc,
            ),
        )

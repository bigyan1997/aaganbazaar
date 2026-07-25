from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Default pagination. max_page_size caps ?page_size= so a client can't
    force the DB to return an unbounded number of rows in one request."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

//Searchable dropdown list creator function
function listCreator(searchInput, hiddenInput, list, items, icon) {
    if (!searchInput || !hiddenInput || !list) return;
  if (searchInput.dataset.listCreatorBound === '1') return;
  searchInput.dataset.listCreatorBound = '1';

    // Érvényes értékek (ha li-hez data-value/val van megadva, azt is figyelembe vesszük)
    const validValues = Array.from(items).map(i => (i.dataset.value ?? i.getAttribute('val') ?? i.textContent.trim()));

    // Keresés a listában
    function filterList(value) {
      const q = (value || '').toLowerCase();
      let hasVisible = false;
      items.forEach(item => {
        const show = item.textContent.toLowerCase().includes(q);
        item.style.display = show ? "block" : "none";
        if (show) hasVisible = true;
      });
      list.classList.toggle("d-none", !hasVisible);
    }

    // Open / close list
    function openList() {
      filterList('');
      list.classList.remove("d-none");
    }
    function closeList() {
      list.classList.add("d-none");
    }
    function toggleList() {
      if (list.classList.contains("d-none")) openList(); else closeList();
    }

    // Input events
    searchInput.addEventListener("input", (e) => filterList(e.target.value));
    searchInput.addEventListener("focus", () => openList());

    // Icon: make clickable and keyboard accessible
    if (icon) {
      icon.style.cursor = 'pointer';
      icon.setAttribute('role', 'button');
      icon.tabIndex = 0;
      icon.addEventListener("click", (e) => { e.stopPropagation(); toggleList(); });
      icon.addEventListener("keydown", (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggleList(); }
      });
    }

    // Listaelem kiválasztás
    items.forEach(item => {
      item.addEventListener("click", () => {
        const textvalue = item.textContent.trim();
        // Ha van data-value vagy val attribútum, azt használjuk a hidden input értékének,
        // különben a megjelenített szöveget (textvalue).
        const value = item.dataset.value ?? item.getAttribute('val') ?? textvalue;

        searchInput.value = textvalue;
        hiddenInput.value = value;
        closeList();
        // jelzés, ha más kód figyel a change eseményre
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    // Kattintás kívül → lista elrejtése (figyelembe vesszük az ikont is)
    document.addEventListener("click", function(e) {
      const target = e.target;
      const clickedInside = searchInput.contains(target) || list.contains(target) || (icon && icon.contains(target));
      if (!clickedInside) closeList();
    });

    // Form submit ellenőrzés → csak listaelem lehet
    const form = searchInput.closest('form');
    if (form) {
      form.addEventListener("submit", function(e) {
        if (!document.contains(hiddenInput)) return;
        const value = hiddenInput.value.trim();
        // validValues tartalmazza a megengedett értékeket (data-value vagy text)
        if (!validValues.includes(value)) {
          e.preventDefault();
          searchInput.classList.add('is-invalid');
          setTimeout(()=> searchInput.classList.remove('is-invalid'), 1200);
        }
      });
    }
  }









//Table search and highlight function
document.addEventListener('DOMContentLoaded', () => {

    const searchInput = document.getElementById('search');
    const tableBody = document.getElementById('TableBody');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const dropdownButton = document.getElementById('dropdownMenuButton');
    const cells = tableBody?.getElementsByTagName('th');
    const searchForm = document.getElementById('searchForm');
    var cellIndex = 0;

    const searchStateCookieName = 'vaultxTableSearchState';

    function getCurrentUrlKey() {
      return `${window.location.origin}${window.location.pathname}${window.location.search}`;
    }

    function setSearchStateCookie(state) {
      const cookieValue = encodeURIComponent(JSON.stringify({
        url: getCurrentUrlKey(),
        value: state.value ?? '',
        cellIndex: state.cellIndex ?? 0,
        dropdownLabel: state.dropdownLabel ?? ''
      }));
      document.cookie = `${searchStateCookieName}=${cookieValue}; max-age=3600; path=/; samesite=lax`;
    }

    function getSearchStateCookie() {
      const cookieEntry = document.cookie
        .split('; ')
        .find(cookie => cookie.startsWith(`${searchStateCookieName}=`));

      if (!cookieEntry) return null;

      try {
        return JSON.parse(decodeURIComponent(cookieEntry.split('=').slice(1).join('=')));
      } catch {
        return null;
      }
    }

    function clearSearchStateCookie() {
      document.cookie = `${searchStateCookieName}=; max-age=0; path=/; samesite=lax`;
    }

    function applySearchState(state) {
      if (!state || state.url !== getCurrentUrlKey() || !searchInput || !tableBody || !dropdownButton) return;

      const restoredValue = typeof state.value === 'string' ? state.value : '';
      const restoredCellIndex = Number.isInteger(state.cellIndex) ? state.cellIndex : 0;
      const restoredLabel = typeof state.dropdownLabel === 'string' ? state.dropdownLabel : '';

      searchInput.value = restoredValue;
      cellIndex = restoredCellIndex;
      if (restoredLabel) {
        dropdownButton.innerHTML = restoredLabel;
      }
    }
    


    if(tableBody){
    Array.from(cells).forEach((cell, index) => {
        
        if (cell.innerHTML === '&nbsp;') return; 
        if (index === 0) {
            dropdownButton.innerHTML = cell.innerHTML;
        }
        const menuItem = document.createElement('a');
        menuItem.className = 'dropdown-item';
        menuItem.innerHTML = cell.innerHTML;
        menuItem.href = '#';
        dropdownMenu?.appendChild(menuItem);
        menuItem.addEventListener('click', fv => {
            const thisCellIndex = index;
            fv.preventDefault();
            searchInput.value = ''; 
            filterTable(fv);
            let searchScope = fv.target.innerHTML;
            dropdownButton.innerHTML = searchScope;
            cellIndex = thisCellIndex;
          clearSearchStateCookie();




        });
          cell.dataset.originalText = cell.dataset.originalText ?? cell.textContent;
        
    });
    };
    const form = document.getElementById('noSubmitForm'); // vagy .form-inline
    if( form ){
        form.addEventListener('submit', e => {
            e.preventDefault(); // megakadályozza az alapértelmezett submit-et
        });
    };
    
    dropdownButton?.addEventListener('click', fs => {
      filterTable(fs);
    });

    searchInput?.classList.add('border', 'border-1', 'border-primary');
    searchInput?.addEventListener('input', fv => {
        filterTable(fv);

      const currentValue = searchInput.value.trim();
      if (currentValue) {
        setSearchStateCookie({
          value: currentValue,
          cellIndex,
          dropdownLabel: dropdownButton?.innerHTML ?? ''
        });
      } else {
        clearSearchStateCookie();
      }
    }); 

    applySearchState(getSearchStateCookie());
    if (searchInput?.value?.trim()) {
      filterTable({ preventDefault() {} });
    }





    function filterTable(fv) {
              fv?.preventDefault?.();
      const searchTerm = searchInput.value.trim().toLowerCase();
        const rows = tableBody.getElementsByTagName('tr');
        let visibleRowCount = 0;

      function escapeRegExp(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }

      function renderHighlightedCell(cell, originalText, term) {
        cell.textContent = '';

        if (!term) {
          cell.textContent = originalText;
          return;
        }

        const regex = new RegExp(escapeRegExp(term), 'gi');
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(originalText)) !== null) {
          if (match.index > lastIndex) {
            cell.appendChild(document.createTextNode(originalText.slice(lastIndex, match.index)));
          }

          const highlight = document.createElement('span');
          highlight.className = 'bg-warning';
          highlight.textContent = match[0];
          cell.appendChild(highlight);
          lastIndex = match.index + match[0].length;

          if (match[0].length === 0) {
            regex.lastIndex += 1;
          }
        }

        if (lastIndex < originalText.length) {
          cell.appendChild(document.createTextNode(originalText.slice(lastIndex)));
        }
      }

        Array.from(rows).forEach((row, index) => {
            if (index === 0) return; // Skip header row
        const activeCell = row.cells[cellIndex];
        if (!activeCell) return;

        const originalText = activeCell.dataset.originalText ?? activeCell.textContent;
        const title = originalText.toLowerCase();
            row.style.display = (title.includes(searchTerm)) ? '' : 'none';
            if (title.includes(searchTerm)) {
                row.style.display = '';
          renderHighlightedCell(activeCell, originalText, searchTerm);
                visibleRowCount++;
            } else {
                row.style.display = 'none';
          activeCell.textContent = originalText;
            }
        });

          if (!searchTerm) {
            clearSearchStateCookie();
          }

    }

    





      // Table sort and order function
      const allHeaders = tableBody ? Array.from(tableBody.querySelectorAll('th')) : [];
      const sortableHeaders = allHeaders.filter(header => header.textContent.replace(/\u00a0/g, ' ').trim().length > 0);
      const sortState = {
        columnIndex: -1,
        direction: 'asc'
      };

      const tableElement = tableBody?.tagName === 'TABLE' ? tableBody : tableBody?.querySelector('table');
      const tableBodyElement = tableElement?.tBodies?.[0] ?? tableElement?.querySelector('tbody');
      const originalRowOrder = tableBodyElement ? Array.from(tableBodyElement.querySelectorAll('tr')).filter(row => !row.querySelector('th')) : [];

      function ensureSortIcon(header) {
        let icon = header.querySelector('.sort-icon');

        if (!icon) {
          icon = document.createElement('i');
          icon.className = 'bi bi-sort-down sort-icon ms-1 opacity-50';
          icon.setAttribute('aria-hidden', 'true');
          header.appendChild(icon);
        }

        return icon;
      }

      function ensureResetIcon(header) {
        let icon = header.querySelector('.reset-sort-icon');

        if (!icon) {
          icon = document.createElement('i');
          icon.className = 'bi bi-x-lg reset-sort-icon position-absolute end-0 top-50 translate-middle-y me-2 text-danger';
          icon.setAttribute('role', 'button');
          icon.setAttribute('aria-label', 'Alapállapot visszaállítása');
          icon.setAttribute('title', 'Alapállapot visszaállítása');
          icon.tabIndex = 0;
          header.appendChild(icon);
        }

        return icon;
      }

      function getSortableCellValue(row, columnIndex) {
        const cell = row.cells[columnIndex];
        return (cell?.dataset.originalText ?? cell?.textContent ?? '').trim();
      }

      function updateSortIndicators(activeHeader) {
        sortableHeaders.forEach(header => {
          header.setAttribute('aria-sort', 'none');

          const icon = ensureSortIcon(header);
          icon.className = 'bi bi-sort-down sort-icon ms-1 opacity-50';
        });

        if (activeHeader) {
          activeHeader.setAttribute('aria-sort', sortState.direction === 'asc' ? 'ascending' : 'descending');

          const activeIcon = ensureSortIcon(activeHeader);
          activeIcon.className = sortState.direction === 'asc'
            ? 'bi bi-sort-up sort-icon ms-1'
            : 'bi bi-sort-down sort-icon ms-1';
        }
      }

      function resetTableOrder() {
        if (!tableBodyElement || !originalRowOrder.length) return;

        originalRowOrder.forEach(row => tableBodyElement.appendChild(row));
        sortState.columnIndex = -1;
        sortState.direction = 'asc';
        updateSortIndicators(null);

        if (searchInput?.value?.trim()) {
          filterTable({ preventDefault() {} });
        }
      }

      function sortTableByColumn(columnIndex) {
        if (!tableBodyElement) return;

        const rows = Array.from(tableBodyElement.querySelectorAll('tr')).filter(row => !row.querySelector('th'));
        if (!rows.length) return;

        sortState.direction = sortState.columnIndex === columnIndex && sortState.direction === 'asc' ? 'desc' : 'asc';
        sortState.columnIndex = columnIndex;

        rows.sort((leftRow, rightRow) => {
          const leftValue = getSortableCellValue(leftRow, columnIndex);
          const rightValue = getSortableCellValue(rightRow, columnIndex);
          const comparison = leftValue.localeCompare(rightValue, undefined, {
            numeric: true,
            sensitivity: 'base'
          });

          return sortState.direction === 'asc' ? comparison : -comparison;
        });

        rows.forEach(row => tableBodyElement.appendChild(row));

        updateSortIndicators(sortableHeaders[columnIndex]);

        if (searchInput?.value?.trim()) {
          filterTable({ preventDefault() {} });
        }
      }

      const lastHeader = allHeaders[allHeaders.length - 1] ?? null;

    if (lastHeader) {
          lastHeader.style.position = 'relative';
          lastHeader.style.paddingRight = '3rem';

          const resetIcon = ensureResetIcon(lastHeader);
          resetIcon.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            resetTableOrder();
          });

          resetIcon.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              resetTableOrder();
            }
          });
        }
      sortableHeaders.forEach((header, index) => {
        header.style.cursor = 'pointer';
        header.title = 'Rendezés';
        header.style.position = 'relative';
        header.style.paddingRight = '1.5rem';
        header.setAttribute('aria-sort', 'none');
        ensureSortIcon(header);



        header.addEventListener('click', event => {
          if (event.target.closest('.reset-sort-icon')) return;
          if (event.target.closest('a, button, input, select, textarea, label')) return;
          sortTableByColumn(index);
        });
      });

      function getVisibleTableRows() {
        if (!tableBodyElement) return [];

        return Array.from(tableBodyElement.querySelectorAll('tr')).filter(row => {
          if (row.querySelector('th')) return false;
          return window.getComputedStyle(row).display !== 'none';
        });
      }

      function buildExportHeaderRow() {
        return sortableHeaders.map(header => header.textContent.replace(/\s+/g, ' ').trim());
      }

      function buildExportDataRows() {
        const headers = buildExportHeaderRow();

        return getVisibleTableRows().map(row => headers.map((_, columnIndex) => {
          const cell = row.cells[columnIndex];
          return (cell?.dataset.originalText ?? cell?.textContent ?? '').trim();
        }));
      }

      function buildBaseInfoRows() {
        const exportMeta = window.VAULTX_EXPORT_META || {};

        return [
          ['Field', 'Value'],
          ['Competition Name', exportMeta.systemName || 'N/A'],
          ['URL', exportMeta.slug || 'root'],
          ['Username', exportMeta.username || ''],
          ['Time', exportMeta.time || '']
        ];
      }

      function sanitizeFilePart(value) {
        return String(value || '')
          .trim()
          .replace(/[\\/:*?"<>|]+/g, '_')
          .replace(/\s+/g, '_')
          .replace(/^_+|_+$/g, '');
      }

      function exportTableToExcel() {
        if (!window.XLSX) {
          const message = 'Excel export is unavailable because the XLSX library failed to load.';
          if (typeof ShowErrorToast === 'function') {
            ShowErrorToast(message);
          } else {
            window.alert(message);
          }
          return;
        }

        const headers = buildExportHeaderRow();
        const dataRows = buildExportDataRows();
        const workbook = window.XLSX.utils.book_new();

        const tableSheet = window.XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
        const baseInfoSheet = window.XLSX.utils.aoa_to_sheet(buildBaseInfoRows());

        window.XLSX.utils.book_append_sheet(workbook, tableSheet, 'Export');
        window.XLSX.utils.book_append_sheet(workbook, baseInfoSheet, 'Query Info');

        const meta = window.VAULTX_EXPORT_META || {};
        const fileNameParts = [
          'VaultX',
          sanitizeFilePart(meta.systemName || 'export'),
          sanitizeFilePart(meta.slug || 'table'),
          new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')
        ].filter(Boolean);

        window.XLSX.writeFile(workbook, `${fileNameParts.join('_')}.xlsx`);
      }

      const searchControlsWrapper = dropdownButton?.closest('.dropdown')?.parentElement;
      if (searchControlsWrapper && sortableHeaders.length > 0 && tableBodyElement) {
        const exportButton = document.createElement('button');
        exportButton.type = 'button';
        exportButton.className = 'btn btn-outline-success rounded-0 rounded-start-1 align-self-centerxwxw';
        exportButton.innerHTML = '<i class="bi bi-file-earmark-excel"></i>';
        exportButton.setAttribute('aria-label', 'Excel export');
        exportButton.addEventListener('click', exportTableToExcel);
        

        const searchForm = document.getElementById('search').parentElement;
        const searchBar = document.getElementById('search');


        if (searchForm) {
          searchBar.classList.remove('rounded-start-1');
          searchForm.insertAdjacentElement('beforebegin', exportButton);
        }
      }










});



document.addEventListener('DOMContentLoaded', () => {

    


    const successToastEl = document.getElementById('formSuccessToast');
    if (successToastEl) {
        const toast = new bootstrap.Toast(successToastEl, { delay: 3000 });
        toast.show();
    }

    const failToastEl = document.getElementById('formFailToast');
    if (failToastEl) {
        const toast = new bootstrap.Toast(failToastEl, { delay: 3000 });
        toast.show();
    }
});

document.addEventListener('DOMContentLoaded', () => {
// Success message show function

  window.ShowSuccessToast = function ShowSuccessToast(message) {
        const toastContainer = document.getElementById('toastContainer');
        const toastHTML = `
            <div class="position-fixed top-0 start-50 translate-middle-x p-3" style="z-index: 9999;">
                <div id="formSuccessToast" class="toast align-items-center text-white bg-success border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                    ${message}
                        </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                </div>
            </div>
      `;
        toastContainer.innerHTML = toastHTML;

        setTimeout(() => {
            toastContainer.innerHTML = '';
        }, 3000);
      };

//Error message show function

    window.ShowErrorToast = function ShowErrorToast(message) {
        const toastContainer = document.getElementById('toastContainer');
        const toastHTML = `
            <div class="position-fixed top-0 start-50 translate-middle-x p-3" style="z-index: 9999;">
                <div id="formErrorToast" class="toast align-items-center text-white bg-danger border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                    ${message}
                        </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                </div>
            </div>
      `;
        toastContainer.innerHTML = toastHTML;

        setTimeout(() => {
            toastContainer.innerHTML = '';
        }, 3000);
      };


  })

    //Excel round to 0.000
    function excelRound(value, decimals = 1) {
        const multiplier = Math.pow(10, decimals);
        return (Math.round((value * multiplier) + Number.EPSILON) / multiplier).toFixed(decimals);
    }      



// Searchable dropdown list creator function
  document.addEventListener('DOMContentLoaded', () => {

 

      document.querySelectorAll('.searchable-dropdown').forEach(wrapper => {
        const input = wrapper.querySelector('.searchable-input');
        const hidden = wrapper.querySelector('.searchable-hidden');
        const list = wrapper.querySelector('.searchable-list');
        const items = list ? list.querySelectorAll('.searchable-item') : null;
        const icon = wrapper.querySelector('.bi-chevron-down');
        
        if (input && hidden && list && items && typeof listCreator === 'function') {
          listCreator(input, hidden, list, items, icon);
        }
      });
    
    });




